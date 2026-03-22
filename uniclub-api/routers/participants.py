from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlmodel import Session
from typing import List, Optional

from database import get_session
from schemas import ParticipantCreate, ParticipantResponse
from services import ParticipantService, EventService
from models import User, UserRole, Participant
from auth import get_current_user, require_roles, require_same_club_or_forbid

router = APIRouter(tags=["Participants"])

# Auth required — any role
@router.get("/events/{event_id}/participants", response_model=List[ParticipantResponse], summary="List participants by event")
def list_participants_by_event(
    event_id: int,
    linked_member_only: Optional[bool] = Query(None, description="True for linked members only, False for external attendees only"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return ParticipantService.list_participants_by_event(session, event_id=event_id, linked_member_only=linked_member_only)

# Protected — advisor/board_member, own club events only
@router.post("/participants", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED, summary="Add a participant")
def add_participant(
    data: ParticipantCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    event = EventService.get_event(session, data.event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    return ParticipantService.add_participant(session, data)

# Protected — advisor/board_member, own club events only
@router.put("/participants/{participant_id}", response_model=ParticipantResponse, summary="Update a participant")
def update_participant(
    participant_id: int,
    data: ParticipantCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    p = session.get(Participant, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    event = EventService.get_event(session, p.event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    p.first_name = data.first_name
    p.last_name = data.last_name
    p.email = data.email
    p.phone = data.phone
    p.checked_in_at = data.checked_in_at
    session.add(p)
    session.commit()
    session.refresh(p)
    return p

# Protected — advisor/board_member, own club events only
@router.delete("/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a participant")
def delete_participant(
    participant_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    p = session.get(Participant, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    event = EventService.get_event(session, p.event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    session.delete(p)
    session.commit()
