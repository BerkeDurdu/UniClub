"""Admin-only routes for dynamic authorization and user management."""
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from auth import require_admin, hash_password
from database import get_session
from models import Permission, RolePermission, User, UserRole, Club

router = APIRouter(prefix="/admin", tags=["Admin"])


class PermissionOut(BaseModel):
    id: int
    code: str
    description: str

    class Config:
        from_attributes = True


class RolePermissionMatrix(BaseModel):
    """Matrix payload: role -> list of permission codes."""
    matrix: Dict[str, List[str]]


class AdminUserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    club_id: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True


class RoleChange(BaseModel):
    role: UserRole
    club_id: Optional[int] = None


class ActiveChange(BaseModel):
    is_active: bool


class CreateUserPayload(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole
    club_id: Optional[int] = None


@router.get("/permissions", response_model=List[PermissionOut], summary="List all permission codes")
def list_permissions(_: User = Depends(require_admin), session: Session = Depends(get_session)):
    return session.exec(select(Permission).order_by(Permission.code)).all()


@router.get("/role-permissions", summary="Get the role x permission matrix")
def get_matrix(_: User = Depends(require_admin), session: Session = Depends(get_session)) -> Dict[str, List[str]]:
    rows = session.exec(
        select(RolePermission, Permission).join(Permission, RolePermission.permission_id == Permission.id)
    ).all()
    matrix: Dict[str, List[str]] = {role.value: [] for role in UserRole}
    for rp, perm in rows:
        role_value = rp.role.value if isinstance(rp.role, UserRole) else rp.role
        matrix.setdefault(role_value, []).append(perm.code)
    return matrix


@router.put("/role-permissions", summary="Replace the role x permission matrix")
def set_matrix(
    payload: RolePermissionMatrix,
    _: User = Depends(require_admin),
    session: Session = Depends(get_session),
) -> Dict[str, List[str]]:
    code_to_perm = {p.code: p for p in session.exec(select(Permission)).all()}
    # Validate
    for role_str, codes in payload.matrix.items():
        try:
            UserRole(role_str)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Unknown role: {role_str}")
        for code in codes:
            if code not in code_to_perm:
                raise HTTPException(status_code=400, detail=f"Unknown permission: {code}")

    # Replace each role atomically
    for role_str, codes in payload.matrix.items():
        role = UserRole(role_str)
        existing = session.exec(select(RolePermission).where(RolePermission.role == role)).all()
        for row in existing:
            session.delete(row)
        session.flush()
        for code in codes:
            perm = code_to_perm[code]
            session.add(RolePermission(role=role, permission_id=perm.id))
    session.commit()
    return get_matrix(_, session)  # type: ignore[arg-type]


@router.get("/users", response_model=List[AdminUserOut], summary="List all users")
def list_users(_: User = Depends(require_admin), session: Session = Depends(get_session)):
    return session.exec(select(User).order_by(User.id)).all()


@router.put("/users/{user_id}/role", response_model=AdminUserOut, summary="Change a user's role")
def change_role(
    user_id: int,
    payload: RoleChange,
    _: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    if payload.role in (UserRole.advisor, UserRole.board_member):
        if payload.club_id is None and user.club_id is None:
            raise HTTPException(status_code=400, detail="club_id required for this role")
        if payload.club_id is not None:
            club = session.get(Club, payload.club_id)
            if not club:
                raise HTTPException(status_code=404, detail="Club not found")
            user.club_id = payload.club_id
    elif payload.role == UserRole.admin:
        user.club_id = None
    elif payload.role == UserRole.member and payload.club_id is not None:
        user.club_id = payload.club_id
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.put("/users/{user_id}/active", response_model=AdminUserOut, summary="Activate/deactivate a user")
def change_active(
    user_id: int,
    payload: ActiveChange,
    _: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = payload.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/users", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED, summary="Create a user (admin)")
def create_user(
    payload: CreateUserPayload,
    _: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    email = payload.email.lower().strip()
    if session.exec(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if payload.role in (UserRole.advisor, UserRole.board_member) and payload.club_id is None:
        raise HTTPException(status_code=400, detail="club_id required for this role")
    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        club_id=payload.club_id,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
