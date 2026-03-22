from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import VenueCreate, VenueResponse
from services import VenueService
from models import User, UserRole
from auth import get_current_user, require_roles

router = APIRouter(prefix="/venues", tags=["Venues"])

# Auth required — any role
@router.get("", response_model=List[VenueResponse], summary="List all venues")
def list_venues(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return VenueService.list_venues(session)

# Auth required — any role
@router.get("/{venue_id}", response_model=VenueResponse, summary="Get a venue by ID")
def get_venue(venue_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return VenueService.get_venue(session, venue_id)

# Protected — advisor/board_member can create venues
@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED, summary="Create a new venue")
def create_venue(
    data: VenueCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    return VenueService.create_venue(session, data)

# Protected — advisor/board_member can update venues
@router.put("/{venue_id}", response_model=VenueResponse, summary="Update a venue")
def update_venue(
    venue_id: int,
    data: VenueCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    venue = VenueService.get_venue(session, venue_id)
    venue.name = data.name
    venue.location = data.location
    venue.capacity = data.capacity
    venue.venue_type = data.venue_type
    venue.description = data.description
    session.add(venue)
    session.commit()
    session.refresh(venue)
    return venue
