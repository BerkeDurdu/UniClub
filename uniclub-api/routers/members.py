from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session
from typing import List, Optional

from database import get_session
from schemas import MemberCreate, MemberResponse
from services import MemberService

router = APIRouter(prefix="/members", tags=["Members"])

@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED, summary="Create a new member")
def create_member(data: MemberCreate, session: Session = Depends(get_session)):
    return MemberService.create_member(session, data)

@router.get("", response_model=List[MemberResponse], summary="List all members", description="Filter and paginate members.")
def list_members(
    department: Optional[str] = Query(None, description="Filter by department"),
    club_id: Optional[int] = Query(None, description="Filter by club ID"),
    search: Optional[str] = Query(None, description="Search by name or student ID"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return"),
    session: Session = Depends(get_session)
):
    return MemberService.list_members(session, department=department, club_id=club_id, search=search, skip=skip, limit=limit)

@router.get("/{member_id}", response_model=MemberResponse, summary="Get a member by ID")
def get_member(member_id: int, session: Session = Depends(get_session)):
    return MemberService.get_member(session, member_id)
