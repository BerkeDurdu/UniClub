import hashlib
import secrets
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from config import settings
from database import get_session
from email_utils import send_email
from models import User, UserRole, Member, Advisor, BoardMember, Club, PasswordResetToken
from schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    UserMeResponse,
    TokenResponse,
    PasswordForgotRequest,
    PasswordResetRequest,
)
from auth import hash_password, verify_password, create_access_token, create_challenge_token, get_current_user, get_role_permissions
from routers.twofa import has_any_2fa, enabled_methods

router = APIRouter(prefix="/auth", tags=["Auth"])


def _hash_reset_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register(data: UserRegister, session: Session = Depends(get_session)):
    # Normalize email
    email = data.email.lower().strip()

    # Check duplicate email
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Resolve club from either existing club_id or manual club input
    resolved_club_id = data.club_id

    if (
        resolved_club_id is None
        and data.role in (UserRole.advisor, UserRole.board_member)
        and (data.club_input_mode or "").lower() == "manual"
    ):
        manual_name = (data.manual_club_name or "").strip()
        manual_category = (data.manual_club_category or "").strip()
        manual_description = (data.manual_club_description or "").strip()
        manual_founded = data.manual_club_founded_date

        if not manual_name or not manual_category or not manual_description or manual_founded is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manual club details are required when club input mode is manual",
            )

        existing_club = session.exec(select(Club).where(Club.name == manual_name)).first()
        if existing_club:
            resolved_club_id = existing_club.id
        else:
            new_club = Club(
                name=manual_name,
                category=manual_category,
                description=manual_description,
                founded_date=manual_founded,
            )
            session.add(new_club)
            session.flush()
            resolved_club_id = new_club.id

    if data.role in (UserRole.advisor, UserRole.board_member):
        if resolved_club_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="club_id is required for advisor and board_member roles")

    if resolved_club_id is not None:
        club = session.get(Club, resolved_club_id)
        if not club:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found")

    # Check advisor uniqueness per club
    if data.role == UserRole.advisor and resolved_club_id is not None:
        existing_advisor = session.exec(
            select(Advisor).where(Advisor.club_id == resolved_club_id)
        ).first()
        if existing_advisor and existing_advisor.email.lower() != email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Club already has an advisor")

    # Create user + link role profile in one transaction
    user = User(
        email=email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name.strip(),
        role=data.role,
        club_id=resolved_club_id,
        is_active=True,
    )
    session.add(user)

    try:
        session.flush()
        _link_role_profile(session, user, email)
        session.commit()
        session.refresh(user)
    except HTTPException:
        session.rollback()
        raise

    # Generate token
    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", summary="Login. Returns either a JWT or a 2FA challenge.")
def login(data: UserLogin, session: Session = Depends(get_session)):
    email = data.email.lower().strip()
    user = session.exec(select(User).where(User.email == email)).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if has_any_2fa(session, user.id):
        return {
            "kind": "challenge",
            "challenge_token": create_challenge_token(user),
            "methods": enabled_methods(session, user.id),
        }

    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserMeResponse, summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    profile = None
    role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)

    if role == UserRole.member:
        record = session.exec(select(Member).where(Member.user_id == current_user.id)).first()
        if record:
            profile = {
                "id": record.id, "student_id": record.student_id,
                "first_name": record.first_name, "last_name": record.last_name,
                "email": record.email, "department": record.department,
                "join_date": str(record.join_date),
                "leave_date": str(record.leave_date) if record.leave_date else None,
                "club_id": record.club_id,
            }
    elif role == UserRole.advisor:
        record = session.exec(select(Advisor).where(Advisor.user_id == current_user.id)).first()
        if record:
            profile = {
                "id": record.id, "full_name": record.full_name,
                "email": record.email, "department": record.department,
                "assigned_date": str(record.assigned_date),
                "club_id": record.club_id,
            }
    elif role == UserRole.board_member:
        record = session.exec(select(BoardMember).where(BoardMember.user_id == current_user.id)).first()
        if record:
            profile = {
                "id": record.id, "student_id": record.student_id,
                "first_name": record.first_name, "last_name": record.last_name,
                "email": record.email, "role": record.role.value if record.role else None,
                "join_date": str(record.join_date),
                "leave_date": str(record.leave_date) if record.leave_date else None,
                "club_id": record.club_id,
            }

    role_value = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
    perms = sorted(get_role_permissions(session, role_value)) if role_value != UserRole.admin else ["*"]
    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        club_id=current_user.club_id,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        profile=profile,
        permissions=perms,
    )


@router.post("/password/forgot", summary="Request a password reset email")
def password_forgot(data: PasswordForgotRequest, session: Session = Depends(get_session)):
    email = data.email.lower().strip()
    user = session.exec(select(User).where(User.email == email)).first()
    if user and user.is_active:
        raw_token = secrets.token_urlsafe(32)
        record = PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_reset_token(raw_token),
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )
        session.add(record)
        session.commit()
        link = f"{settings.frontend_base_url.rstrip('/')}/auth/reset-password?token={raw_token}"
        send_email(
            user.email,
            "Reset your UniClub password",
            (
                "We received a request to reset your UniClub password.\n\n"
                f"Open this link to set a new password (valid for 1 hour):\n{link}\n\n"
                "If you did not request this, you can safely ignore this email."
            ),
        )
    return {"ok": True}


@router.post("/password/reset", summary="Consume a reset token and set a new password")
def password_reset(data: PasswordResetRequest, session: Session = Depends(get_session)):
    record = session.exec(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == _hash_reset_token(data.token))
    ).first()
    if not record or record.used_at is not None or record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user = session.get(User, record.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user.hashed_password = hash_password(data.new_password)
    record.used_at = datetime.utcnow()
    session.add(user)
    session.add(record)

    other_tokens = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.id != record.id,
            PasswordResetToken.used_at.is_(None),
        )
    ).all()
    for t in other_tokens:
        t.used_at = datetime.utcnow()
        session.add(t)

    session.commit()
    return {"ok": True}


def _link_role_profile(session: Session, user: User, email: str) -> None:
    """Link the user to an existing role-specific record or create a new one."""
    from datetime import date

    role = user.role if isinstance(user.role, UserRole) else UserRole(user.role)

    if role == UserRole.member:
        existing = session.exec(select(Member).where(Member.email == email)).first()
        if existing:
            if existing.user_id is not None and existing.user_id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This member profile is already linked to another user")
            existing.user_id = user.id
            session.add(existing)
        else:
            name_parts = user.full_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            member = Member(
                student_id=f"auto_{user.id}",
                first_name=first_name,
                last_name=last_name,
                email=email,
                department="Unspecified",
                join_date=date.today(),
                club_id=user.club_id,
                user_id=user.id,
            )
            session.add(member)

    elif role == UserRole.advisor:
        existing = session.exec(select(Advisor).where(Advisor.email == email)).first()
        if existing:
            if existing.user_id is not None and existing.user_id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This advisor profile is already linked to another user")
            existing.user_id = user.id
            session.add(existing)
        else:
            advisor = Advisor(
                full_name=user.full_name,
                email=email,
                department="Unspecified",
                assigned_date=date.today(),
                club_id=user.club_id,
                user_id=user.id,
            )
            session.add(advisor)

    elif role == UserRole.board_member:
        existing = session.exec(select(BoardMember).where(BoardMember.email == email)).first()
        if existing:
            if existing.user_id is not None and existing.user_id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This board member profile is already linked to another user")
            existing.user_id = user.id
            session.add(existing)
        else:
            from models import BoardRole
            name_parts = user.full_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            bm = BoardMember(
                student_id=f"auto_{user.id}",
                first_name=first_name,
                last_name=last_name,
                email=email,
                role=BoardRole.Coordinator,
                join_date=date.today(),
                club_id=user.club_id,
                user_id=user.id,
            )
            session.add(bm)

    session.flush()
