"""OAuth 2.0 social login: Google, GitHub, Microsoft, Facebook."""
import secrets
from typing import Dict, List, Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from authlib.integrations.starlette_client import OAuth, OAuthError

from auth import create_access_token, hash_password
from config import settings
from database import get_session
from models import OAuthAccount, User, UserRole

router = APIRouter(prefix="/auth/oauth", tags=["OAuth"])

# ---------------------
# Provider registry
# ---------------------
oauth = OAuth()


def _provider_configured(name: str) -> bool:
    return bool(getattr(settings, f"{name}_client_id", None) and getattr(settings, f"{name}_client_secret", None))


if _provider_configured("google"):
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

if _provider_configured("github"):
    oauth.register(
        name="github",
        client_id=settings.github_client_id,
        client_secret=settings.github_client_secret,
        access_token_url="https://github.com/login/oauth/access_token",
        authorize_url="https://github.com/login/oauth/authorize",
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "user:email"},
    )

if _provider_configured("microsoft"):
    tenant = settings.microsoft_tenant or "common"
    oauth.register(
        name="microsoft",
        client_id=settings.microsoft_client_id,
        client_secret=settings.microsoft_client_secret,
        server_metadata_url=f"https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile User.Read"},
    )

if _provider_configured("facebook"):
    oauth.register(
        name="facebook",
        client_id=settings.facebook_client_id,
        client_secret=settings.facebook_client_secret,
        access_token_url="https://graph.facebook.com/v18.0/oauth/access_token",
        authorize_url="https://www.facebook.com/v18.0/dialog/oauth",
        api_base_url="https://graph.facebook.com/v18.0/",
        client_kwargs={"scope": "email public_profile"},
    )


def _redirect_uri(provider: str) -> str:
    return f"{settings.oauth_redirect_base.rstrip('/')}/auth/oauth/{provider}/callback"


@router.get("/providers", summary="List configured OAuth providers")
def list_providers() -> Dict[str, List[str]]:
    enabled: List[str] = []
    for name in ("google", "github", "microsoft", "facebook"):
        if _provider_configured(name):
            enabled.append(name)
    return {"providers": enabled}


@router.get("/{provider}/login", summary="Begin OAuth flow")
async def login(provider: str, request: Request):
    if provider not in ("google", "github", "microsoft", "facebook"):
        raise HTTPException(status_code=404, detail="Unknown provider")
    if not _provider_configured(provider):
        raise HTTPException(status_code=503, detail=f"Provider '{provider}' is not configured")
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(status_code=503, detail="Provider client not initialized")
    return await client.authorize_redirect(request, _redirect_uri(provider))


async def _fetch_profile(provider: str, client, token) -> Dict[str, Optional[str]]:
    """Return a unified {provider_account_id, email, name} dict from each provider."""
    if provider == "google":
        info = token.get("userinfo")
        if not info:
            resp = await client.get("https://openidconnect.googleapis.com/v1/userinfo", token=token)
            info = resp.json()
        return {
            "provider_account_id": str(info.get("sub")),
            "email": info.get("email"),
            "name": info.get("name") or info.get("email"),
        }
    if provider == "github":
        resp = await client.get("user", token=token)
        u = resp.json()
        email = u.get("email")
        if not email:
            emails = (await client.get("user/emails", token=token)).json()
            primary = next((e for e in emails if e.get("primary")), emails[0] if emails else {})
            email = primary.get("email")
        return {
            "provider_account_id": str(u.get("id")),
            "email": email,
            "name": u.get("name") or u.get("login") or email,
        }
    if provider == "microsoft":
        info = token.get("userinfo")
        if not info:
            resp = await client.get("https://graph.microsoft.com/v1.0/me", token=token)
            info = resp.json()
        email = info.get("email") or info.get("preferred_username") or info.get("userPrincipalName") or info.get("mail")
        return {
            "provider_account_id": str(info.get("sub") or info.get("id")),
            "email": email,
            "name": info.get("name") or info.get("displayName") or email,
        }
    if provider == "facebook":
        resp = await client.get("me?fields=id,name,email", token=token)
        info = resp.json()
        return {
            "provider_account_id": str(info.get("id")),
            "email": info.get("email"),
            "name": info.get("name") or info.get("email"),
        }
    raise HTTPException(status_code=400, detail="Unknown provider")


@router.get("/{provider}/callback", summary="OAuth callback")
async def callback(provider: str, request: Request, session: Session = Depends(get_session)):
    if provider not in ("google", "github", "microsoft", "facebook"):
        raise HTTPException(status_code=404, detail="Unknown provider")
    if not _provider_configured(provider):
        raise HTTPException(status_code=503, detail=f"Provider '{provider}' is not configured")
    client = oauth.create_client(provider)
    try:
        token = await client.authorize_access_token(request)
    except OAuthError as e:
        raise HTTPException(status_code=400, detail=f"OAuth failure: {e.error}")

    profile = await _fetch_profile(provider, client, token)
    pid = profile.get("provider_account_id")
    email = (profile.get("email") or "").lower().strip() or None
    name = profile.get("name") or (email or "OAuth user")

    if not pid:
        raise HTTPException(status_code=400, detail="OAuth provider did not return an id")

    # find-or-create
    account = session.exec(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_account_id == pid,
        )
    ).first()

    user: Optional[User]
    if account:
        user = session.get(User, account.user_id)
    else:
        user = None
        if email:
            user = session.exec(select(User).where(User.email == email)).first()
        if user is None:
            placeholder = secrets.token_urlsafe(24)
            user = User(
                email=(email or f"{provider}_{pid}@oauth.local"),
                hashed_password=hash_password(placeholder),
                full_name=name,
                role=UserRole.member,
                club_id=None,
                is_active=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        session.add(OAuthAccount(
            provider=provider,
            provider_account_id=pid,
            email=email,
            user_id=user.id,
        ))
        session.commit()

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is deactivated")

    access = create_access_token(user)
    redirect_url = settings.oauth_frontend_redirect + "?" + urlencode({"token": access})
    return RedirectResponse(redirect_url)
