from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session, select
from typing import List, Optional

from database import get_session
from schemas import MemberCreate, MemberResponse, MemberUpdateLeaveDate
from services import MemberService
from models import User, UserRole, Member
from auth import get_current_user, require_roles, require_same_club_or_forbid, require_same_user_or_forbid

router = APIRouter(prefix="/members", tags=["Members"])

# Auth required — any role
@router.get("", response_model=List[MemberResponse], summary="List all members", description="Filter and paginate members.")
def list_members(
    department: Optional[str] = Query(None, description="Filter by department"),
    club_id: Optional[int] = Query(None, description="Filter by club ID"),
    search: Optional[str] = Query(None, description="Search by name or student ID"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return MemberService.list_members(session, department=department, club_id=club_id, search=search, skip=skip, limit=limit)

# Auth required — any role
@router.get("/{member_id}", response_model=MemberResponse, summary="Get a member by ID")
def get_member(member_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return MemberService.get_member(session, member_id)

# Protected — advisor/board_member, own club only
@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED, summary="Create a new member")
def create_member(
    data: MemberCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    if data.club_id is not None:
        require_same_club_or_forbid(data.club_id, current_user)
    return MemberService.create_member(session, data)

# Protected — member can update own profile, advisor/board_member can update own club members
@router.put("/{member_id}", response_model=MemberResponse, summary="Update member leave date")
def update_member(
    member_id: int,
    data: MemberUpdateLeaveDate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    member = MemberService.get_member(session, member_id)
    role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)

    if role == UserRole.member:
        # Members can only update their own profile
        if member.user_id != current_user.id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Insufficient permissions — you can only modify your own profile")
    elif role in (UserRole.advisor, UserRole.board_member):
        if member.club_id is not None:
            require_same_club_or_forbid(member.club_id, current_user)
        else:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    return MemberService.update_leave_date(session, member_id, data)

# Protected — advisor/board_member, own club only
@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a member")
def delete_member(
    member_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    member = MemberService.get_member(session, member_id)
    if member.club_id is not None:
        require_same_club_or_forbid(member.club_id, current_user)
    session.delete(member)
    session.commit()
