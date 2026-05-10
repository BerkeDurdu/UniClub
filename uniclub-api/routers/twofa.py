"""Two-factor authentication: TOTP, Email OTP, and WebAuthn endpoints."""
import base64
import hashlib
import io
import json
import secrets
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

import pyotp
import qrcode

from auth import get_current_user, decode_token, create_access_token
from config import settings
from database import get_session
from email_utils import send_email
from models import (
    User, UserTOTP, UserEmailOTP, EmailOTPChallenge,
    WebAuthnCredential, WebAuthnChallenge,
)

router = APIRouter(prefix="/2fa", tags=["2FA"])

# ---------------------
# Helpers
# ---------------------

def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _user_has_totp(session: Session, user_id: int) -> bool:
    rec = session.get(UserTOTP, user_id)
    return bool(rec and rec.confirmed_at is not None)


def _user_has_email(session: Session, user_id: int) -> bool:
    rec = session.get(UserEmailOTP, user_id)
    return bool(rec and rec.enabled)


def _user_has_webauthn(session: Session, user_id: int) -> bool:
    return bool(session.exec(
        select(WebAuthnCredential).where(WebAuthnCredential.user_id == user_id)
    ).first())


def has_any_2fa(session: Session, user_id: int) -> bool:
    return _user_has_totp(session, user_id) or _user_has_email(session, user_id) or _user_has_webauthn(session, user_id)


def enabled_methods(session: Session, user_id: int) -> List[str]:
    methods = []
    if _user_has_totp(session, user_id):
        methods.append("totp")
    if _user_has_email(session, user_id):
        methods.append("email")
    if _user_has_webauthn(session, user_id):
        methods.append("webauthn")
    return methods


def _user_from_challenge(token: str, session: Session) -> User:
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid challenge token")
    if payload.get("purpose") != "2fa":
        raise HTTPException(status_code=401, detail="Wrong token purpose")
    user_id = payload.get("user_id")
    user = session.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ---------------------
# Status
# ---------------------

class TwoFactorStatus(BaseModel):
    totp: bool
    email: bool
    webauthn: bool
    webauthn_credentials: List[dict]


@router.get("/status", response_model=TwoFactorStatus)
def status_(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    creds = session.exec(
        select(WebAuthnCredential).where(WebAuthnCredential.user_id == current_user.id)
    ).all()
    return TwoFactorStatus(
        totp=_user_has_totp(session, current_user.id),
        email=_user_has_email(session, current_user.id),
        webauthn=len(creds) > 0,
        webauthn_credentials=[{"id": c.id, "label": c.label, "created_at": c.created_at.isoformat()} for c in creds],
    )

# ---------------------
# TOTP
# ---------------------

class TOTPSetupResponse(BaseModel):
    secret: str
    otpauth_url: str
    qr_png_base64: str


class TOTPConfirm(BaseModel):
    code: str


@router.post("/totp/setup", response_model=TOTPSetupResponse)
def totp_setup(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    secret = pyotp.random_base32()
    record = session.get(UserTOTP, current_user.id)
    if record:
        record.secret = secret
        record.confirmed_at = None
    else:
        record = UserTOTP(user_id=current_user.id, secret=secret)
    session.add(record)
    session.commit()

    issuer = settings.webauthn_rp_name or "UniClub"
    otpauth = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name=issuer)

    img = qrcode.make(otpauth)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return TOTPSetupResponse(secret=secret, otpauth_url=otpauth, qr_png_base64=qr_b64)


@router.post("/totp/confirm")
def totp_confirm(
    payload: TOTPConfirm,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    rec = session.get(UserTOTP, current_user.id)
    if not rec:
        raise HTTPException(status_code=400, detail="TOTP setup not started")
    if not pyotp.TOTP(rec.secret).verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")
    rec.confirmed_at = datetime.utcnow()
    session.add(rec)
    session.commit()
    return {"ok": True}


@router.delete("/totp")
def totp_disable(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    rec = session.get(UserTOTP, current_user.id)
    if rec:
        session.delete(rec)
        session.commit()
    return {"ok": True}

# ---------------------
# Email OTP
# ---------------------

@router.post("/email/enable")
def email_enable(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    rec = session.get(UserEmailOTP, current_user.id)
    if rec:
        rec.enabled = True
    else:
        rec = UserEmailOTP(user_id=current_user.id, enabled=True)
    session.add(rec)
    session.commit()
    return {"ok": True}


@router.delete("/email")
def email_disable(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    rec = session.get(UserEmailOTP, current_user.id)
    if rec:
        rec.enabled = False
        session.add(rec)
        session.commit()
    return {"ok": True}

# ---------------------
# WebAuthn (simplified flow using session-stored challenges)
# ---------------------

class WebAuthnRegisterStartResponse(BaseModel):
    challenge: str
    rp: dict
    user: dict
    pubKeyCredParams: list
    authenticatorSelection: dict
    timeout: int


class WebAuthnRegisterVerify(BaseModel):
    challenge: str
    credential_id: str
    public_key: str
    label: Optional[str] = None


@router.post("/webauthn/register/start", response_model=WebAuthnRegisterStartResponse)
def webauthn_register_start(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    challenge_bytes = secrets.token_bytes(32)
    challenge_b64 = base64.urlsafe_b64encode(challenge_bytes).rstrip(b"=").decode("ascii")
    session.add(WebAuthnChallenge(
        user_id=current_user.id,
        challenge=challenge_b64,
        purpose="register",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    ))
    session.commit()
    return WebAuthnRegisterStartResponse(
        challenge=challenge_b64,
        rp={"id": settings.webauthn_rp_id, "name": settings.webauthn_rp_name},
        user={
            "id": base64.urlsafe_b64encode(str(current_user.id).encode()).rstrip(b"=").decode("ascii"),
            "name": current_user.email,
            "displayName": current_user.full_name,
        },
        pubKeyCredParams=[{"type": "public-key", "alg": -7}, {"type": "public-key", "alg": -257}],
        authenticatorSelection={"userVerification": "preferred"},
        timeout=60000,
    )


@router.post("/webauthn/register/verify")
def webauthn_register_verify(
    payload: WebAuthnRegisterVerify,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    challenge_row = session.exec(
        select(WebAuthnChallenge)
        .where(WebAuthnChallenge.user_id == current_user.id)
        .where(WebAuthnChallenge.challenge == payload.challenge)
        .where(WebAuthnChallenge.purpose == "register")
    ).first()
    if not challenge_row or challenge_row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Challenge invalid or expired")

    existing = session.exec(
        select(WebAuthnCredential).where(WebAuthnCredential.credential_id == payload.credential_id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Credential already registered")

    cred = WebAuthnCredential(
        user_id=current_user.id,
        credential_id=payload.credential_id,
        public_key=payload.public_key,
        sign_count=0,
        label=payload.label or "Security key",
    )
    session.add(cred)
    session.delete(challenge_row)
    session.commit()
    return {"ok": True, "id": cred.id}


@router.delete("/webauthn/{credential_id}")
def webauthn_delete(
    credential_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    cred = session.get(WebAuthnCredential, credential_id)
    if not cred or cred.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Credential not found")
    session.delete(cred)
    session.commit()
    return {"ok": True}

# ---------------------
# Login challenge flow (used after password verify)
# ---------------------

class TwoFAVerifyTOTP(BaseModel):
    challenge_token: str
    code: str


class TwoFAEmailSend(BaseModel):
    challenge_token: str


class TwoFAVerifyEmail(BaseModel):
    challenge_token: str
    code: str


class TwoFAVerifyWebAuthnStart(BaseModel):
    challenge_token: str


class TwoFAVerifyWebAuthn(BaseModel):
    challenge_token: str
    challenge: str
    credential_id: str


@router.post("/login/totp")
def login_totp(payload: TwoFAVerifyTOTP, session: Session = Depends(get_session)):
    user = _user_from_challenge(payload.challenge_token, session)
    rec = session.get(UserTOTP, user.id)
    if not rec or not rec.confirmed_at:
        raise HTTPException(status_code=400, detail="TOTP not enabled")
    if not pyotp.TOTP(rec.secret).verify(payload.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid TOTP code")
    return {"access_token": create_access_token(user), "token_type": "bearer"}


@router.post("/login/email/send")
def login_email_send(payload: TwoFAEmailSend, session: Session = Depends(get_session)):
    user = _user_from_challenge(payload.challenge_token, session)
    if not _user_has_email(session, user.id):
        raise HTTPException(status_code=400, detail="Email OTP not enabled")
    code = f"{secrets.randbelow(1_000_000):06d}"
    challenge = EmailOTPChallenge(
        user_id=user.id,
        code_hash=_hash_code(code),
        purpose="login",
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    session.add(challenge)
    session.commit()
    send_email(
        user.email,
        "Your UniClub login code",
        f"Your one-time login code is: {code}\nThis code expires in 10 minutes.",
    )
    return {"ok": True}


@router.post("/login/email/verify")
def login_email_verify(payload: TwoFAVerifyEmail, session: Session = Depends(get_session)):
    user = _user_from_challenge(payload.challenge_token, session)
    code_hash = _hash_code(payload.code)
    challenge = session.exec(
        select(EmailOTPChallenge)
        .where(EmailOTPChallenge.user_id == user.id)
        .where(EmailOTPChallenge.code_hash == code_hash)
        .where(EmailOTPChallenge.consumed_at.is_(None))
        .order_by(EmailOTPChallenge.id.desc())
    ).first()
    if not challenge or challenge.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired code")
    challenge.consumed_at = datetime.utcnow()
    session.add(challenge)
    session.commit()
    return {"access_token": create_access_token(user), "token_type": "bearer"}


@router.post("/login/webauthn/start")
def login_webauthn_start(payload: TwoFAVerifyWebAuthnStart, session: Session = Depends(get_session)):
    user = _user_from_challenge(payload.challenge_token, session)
    creds = session.exec(
        select(WebAuthnCredential).where(WebAuthnCredential.user_id == user.id)
    ).all()
    if not creds:
        raise HTTPException(status_code=400, detail="WebAuthn not enabled")
    challenge_bytes = secrets.token_bytes(32)
    challenge_b64 = base64.urlsafe_b64encode(challenge_bytes).rstrip(b"=").decode("ascii")
    session.add(WebAuthnChallenge(
        user_id=user.id,
        challenge=challenge_b64,
        purpose="auth",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    ))
    session.commit()
    return {
        "challenge": challenge_b64,
        "rpId": settings.webauthn_rp_id,
        "allowCredentials": [{"type": "public-key", "id": c.credential_id} for c in creds],
        "timeout": 60000,
        "userVerification": "preferred",
    }


@router.post("/login/webauthn/verify")
def login_webauthn_verify(payload: TwoFAVerifyWebAuthn, session: Session = Depends(get_session)):
    user = _user_from_challenge(payload.challenge_token, session)
    challenge_row = session.exec(
        select(WebAuthnChallenge)
        .where(WebAuthnChallenge.user_id == user.id)
        .where(WebAuthnChallenge.challenge == payload.challenge)
        .where(WebAuthnChallenge.purpose == "auth")
    ).first()
    if not challenge_row or challenge_row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Challenge invalid or expired")
    cred = session.exec(
        select(WebAuthnCredential)
        .where(WebAuthnCredential.user_id == user.id)
        .where(WebAuthnCredential.credential_id == payload.credential_id)
    ).first()
    if not cred:
        raise HTTPException(status_code=401, detail="Credential not registered")
    cred.sign_count += 1
    session.add(cred)
    session.delete(challenge_row)
    session.commit()
    return {"access_token": create_access_token(user), "token_type": "bearer"}
