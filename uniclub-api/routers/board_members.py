from fastapi import APIRouter, Depends, status, HTTPException
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import BoardMemberCreate, BoardMemberResponse
from services import BoardMemberService
from models import User, UserRole, BoardMember
from auth import get_current_user, require_roles, require_same_club_or_forbid

router = APIRouter(prefix="/board-members", tags=["Board Members"])

# Auth required — any role
@router.get("", response_model=List[BoardMemberResponse], summary="List all board members")
def list_board_members(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return BoardMemberService.list_board_members(session)

# Auth required — any role
@router.get("/{board_member_id}", response_model=BoardMemberResponse, summary="Get a board member by ID")
def get_board_member(board_member_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return BoardMemberService.get_board_member(session, board_member_id)

# Protected — advisor/board_member, own club only
@router.post("", response_model=BoardMemberResponse, status_code=status.HTTP_201_CREATED, summary="Create a new board member")
def create_board_member(
    data: BoardMemberCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    require_same_club_or_forbid(data.club_id, current_user)
    return BoardMemberService.create_board_member(session, data)

# Protected — board_member can update own profile only
@router.put("/{board_member_id}", response_model=BoardMemberResponse, summary="Update a board member profile")
def update_board_member(
    board_member_id: int,
    data: BoardMemberCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.board_member)),
):
    bm = BoardMemberService.get_board_member(session, board_member_id)
    if bm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions — you can only modify your own profile")

    bm.first_name = data.first_name
    bm.last_name = data.last_name
    bm.email = data.email
    bm.role = data.role
    bm.student_id = data.student_id
    bm.join_date = data.join_date
    bm.club_id = data.club_id
    session.add(bm)
    session.commit()
    session.refresh(bm)
    return bm

# Protected — advisor/board_member, own club only
@router.delete("/{board_member_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a board member")
def delete_board_member(
    board_member_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    bm = BoardMemberService.get_board_member(session, board_member_id)
    require_same_club_or_forbid(bm.club_id, current_user)
    session.delete(bm)
    session.commit()
