from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import BoardMemberCreate, BoardMemberResponse
from services import BoardMemberService

router = APIRouter(prefix="/board-members", tags=["Board Members"])

@router.post("", response_model=BoardMemberResponse, status_code=status.HTTP_201_CREATED, summary="Create a new board member")
def create_board_member(data: BoardMemberCreate, session: Session = Depends(get_session)):
    return BoardMemberService.create_board_member(session, data)

@router.get("", response_model=List[BoardMemberResponse], summary="List all board members")
def list_board_members(session: Session = Depends(get_session)):
    return BoardMemberService.list_board_members(session)

@router.get("/{board_member_id}", response_model=BoardMemberResponse, summary="Get a board member by ID")
def get_board_member(board_member_id: int, session: Session = Depends(get_session)):
    return BoardMemberService.get_board_member(session, board_member_id)
