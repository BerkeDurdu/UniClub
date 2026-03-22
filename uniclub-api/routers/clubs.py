from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session
from typing import List, Optional

from database import get_session
from schemas import ClubCreate, ClubResponse, ClubUpdate
from services import ClubService
from models import User, UserRole
from auth import get_current_user, require_roles, require_same_club_or_forbid

router = APIRouter(prefix="/clubs", tags=["Clubs"])

# Public endpoints — no auth required
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

# Protected — no one can create clubs (no admin role)
@router.post("", response_model=ClubResponse, status_code=status.HTTP_201_CREATED, summary="Create a new club")
def create_club(
    data: ClubCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # No role can create clubs per the auth matrix
    from fastapi import HTTPException
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Club creation is not allowed through the API")

# Protected — advisor/board_member can update their own club only
@router.put("/{club_id}", response_model=ClubResponse, summary="Update a club")
def update_club(
    club_id: int,
    data: ClubUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    require_same_club_or_forbid(club_id, current_user)
    club = ClubService.get_club(session, club_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(club, key, value)
    session.add(club)
    session.commit()
    session.refresh(club)
    return club

# Protected — no one can delete clubs
@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a club")
def delete_club(
    club_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from fastapi import HTTPException
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Club deletion is not allowed through the API")
