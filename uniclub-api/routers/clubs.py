from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session
from typing import List, Optional

from database import get_session
from schemas import ClubCreate, ClubResponse
from services import ClubService

router = APIRouter(prefix="/clubs", tags=["Clubs"])

@router.get("", response_model=List[ClubResponse], summary="List all clubs", description="Get a list of clubs with optional filtering and pagination.")
def list_clubs(
    category: Optional[str] = Query(None, description="Filter by club category"),
    search: Optional[str] = Query(None, description="Case-insensitive search by club name"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return"),
    session: Session = Depends(get_session)
):
    return ClubService.list_clubs(session, category=category, search=search, skip=skip, limit=limit)

@router.get("/{club_id}", response_model=ClubResponse, summary="Get a club by ID")
def get_club(club_id: int, session: Session = Depends(get_session)):
    return ClubService.get_club(session, club_id)

@router.post("", response_model=ClubResponse, status_code=status.HTTP_201_CREATED, summary="Create a new club")
def create_club(data: ClubCreate, session: Session = Depends(get_session)):
    return ClubService.create_club(session, data)

@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a club")
def delete_club(club_id: int, session: Session = Depends(get_session)):
    ClubService.delete_club(session, club_id)
