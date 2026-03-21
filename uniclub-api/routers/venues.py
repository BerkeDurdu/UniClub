from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import VenueCreate, VenueResponse
from services import VenueService

router = APIRouter(prefix="/venues", tags=["Venues"])

@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED, summary="Create a new venue")
def create_venue(data: VenueCreate, session: Session = Depends(get_session)):
    return VenueService.create_venue(session, data)

@router.get("", response_model=List[VenueResponse], summary="List all venues")
def list_venues(session: Session = Depends(get_session)):
    return VenueService.list_venues(session)

@router.get("/{venue_id}", response_model=VenueResponse, summary="Get a venue by ID")
def get_venue(venue_id: int, session: Session = Depends(get_session)):
    return VenueService.get_venue(session, venue_id)
