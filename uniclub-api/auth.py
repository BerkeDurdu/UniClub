from datetime import datetime, timedelta
from typing import Optional, Set

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, ExpiredSignatureError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from config import settings
from database import get_session
from models import User, UserRole, Permission, RolePermission

# ---------------------
# Password Hashing
# ---------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ---------------------
# JWT Token
# ---------------------
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def create_access_token(user: User) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "club_id": user.club_id,
        "exp": expire,
        "purpose": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)

def create_challenge_token(user: User) -> str:
    """Short-lived token that proves password was verified, pending 2FA."""
    expire = datetime.utcnow() + timedelta(minutes=5)
    payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "exp": expire,
        "purpose": "2fa",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])

# Backwards-compat alias used elsewhere
def decode_access_token(token: str) -> dict:
    return decode_token(token)

# ---------------------
# Auth Dependencies
# ---------------------

def _unauth(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    if token is None:
        raise _unauth("Not authenticated")
    try:
        payload = decode_token(token)
    except ExpiredSignatureError:
        raise _unauth("Token has expired")
    except JWTError:
        raise _unauth("Could not validate credentials")

    if payload.get("purpose") != "access":
        raise _unauth("Token cannot be used for this resource")

    user_id = payload.get("user_id")
    if user_id is None:
        raise _unauth("Could not validate credentials")
    user = session.get(User, user_id)
    if user is None:
        raise _unauth("User not found")
    if not user.is_active:
        raise _unauth("Account is deactivated")
    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> Optional[User]:
    if token is None:
        return None
    try:
        return get_current_user(token=token, session=session)
    except HTTPException:
        return None


def require_roles(*roles: UserRole):
    """Returns a dependency that checks the current user has one of the specified roles."""
    def _check(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
        if user_role == UserRole.admin:
            return current_user  # admin always allowed
        if user_role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return _check


def require_same_club_or_forbid(club_id: int, current_user: User) -> None:
    user_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
    if user_role == UserRole.admin:
        return
    if current_user.club_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    if current_user.club_id != club_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")


def require_same_user_or_forbid(user_id: int, current_user: User) -> None:
    user_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
    if user_role == UserRole.admin:
        return
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")


# ---------------------
# Permission system
# ---------------------

def get_role_permissions(session: Session, role: UserRole) -> Set[str]:
    """Return the set of permission codes granted to a role."""
    rows = session.exec(
        select(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .where(RolePermission.role == role)
    ).all()
    return set(rows)


def require_permission(code: str):
    """Dependency factory: 403 unless current user's role has the permission."""
    def _check(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
    ) -> User:
        role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
        if role == UserRole.admin:
            return current_user
        codes = get_role_permissions(session, role)
        if code not in codes:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing permission: {code}")
        return current_user
    return _check


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
    if role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return current_user
