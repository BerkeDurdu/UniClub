from fastapi import APIRouter, Depends, status, HTTPException
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import SponsorshipCreate, SponsorshipResponse
from services import SponsorshipService, EventService
from models import User, UserRole, Sponsorship
from auth import get_current_user, require_roles, require_same_club_or_forbid

router = APIRouter(tags=["Sponsorships"])

# Auth required — any role
@router.get("/sponsorships", response_model=List[SponsorshipResponse], summary="List all sponsorships")
def list_sponsorships(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return SponsorshipService.list_sponsorships(session)

# Auth required — any role
@router.get("/events/{event_id}/sponsorships", response_model=List[SponsorshipResponse], summary="List sponsorships by event")
def list_sponsorships_by_event(event_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return SponsorshipService.list_sponsorships_by_event(session, event_id)

# Protected — advisor/board_member, own club events only
@router.post("/sponsorships", response_model=SponsorshipResponse, status_code=status.HTTP_201_CREATED, summary="Create a sponsorship")
def create_sponsorship(
    data: SponsorshipCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    event = EventService.get_event(session, data.event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    return SponsorshipService.create_sponsorship(session, data)

# Protected — advisor/board_member, own club events only
@router.put("/sponsorships/{sponsorship_id}", response_model=SponsorshipResponse, summary="Update a sponsorship")
def update_sponsorship(
    sponsorship_id: int,
    data: SponsorshipCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    sp = SponsorshipService.get_sponsorship(session, sponsorship_id)
    event = EventService.get_event(session, sp.event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    sp.sponsor_name = data.sponsor_name
    sp.amount = data.amount
    sp.agreement_date = data.agreement_date
    sp.event_id = data.event_id
    session.add(sp)
    session.commit()
    session.refresh(sp)
    return sp

# Protected — advisor/board_member, own club events only
@router.delete("/sponsorships/{sponsorship_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a sponsorship")
def delete_sponsorship(
    sponsorship_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    sp = SponsorshipService.get_sponsorship(session, sponsorship_id)
    event = EventService.get_event(session, sp.event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    session.delete(sp)
    session.commit()
