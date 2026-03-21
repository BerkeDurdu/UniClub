from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import SponsorshipCreate, SponsorshipResponse
from services import SponsorshipService

router = APIRouter(tags=["Sponsorships"])

@router.post("/sponsorships", response_model=SponsorshipResponse, status_code=status.HTTP_201_CREATED, summary="Create a sponsorship")
def create_sponsorship(data: SponsorshipCreate, session: Session = Depends(get_session)):
    return SponsorshipService.create_sponsorship(session, data)

@router.get("/sponsorships", response_model=List[SponsorshipResponse], summary="List all sponsorships")
def list_sponsorships(session: Session = Depends(get_session)):
    return SponsorshipService.list_sponsorships(session)

@router.get("/events/{event_id}/sponsorships", response_model=List[SponsorshipResponse], summary="List sponsorships by event")
def list_sponsorships_by_event(event_id: int, session: Session = Depends(get_session)):
    return SponsorshipService.list_sponsorships_by_event(session, event_id)
