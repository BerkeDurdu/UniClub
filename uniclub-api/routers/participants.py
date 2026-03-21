from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session
from typing import List, Optional

from database import get_session
from schemas import ParticipantCreate, ParticipantResponse
from services import ParticipantService

router = APIRouter(tags=["Participants"])

@router.post("/participants", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED, summary="Add a participant")
def add_participant(data: ParticipantCreate, session: Session = Depends(get_session)):
    return ParticipantService.add_participant(session, data)

@router.get("/events/{event_id}/participants", response_model=List[ParticipantResponse], summary="List participants by event")
def list_participants_by_event(
    event_id: int,
    linked_member_only: Optional[bool] = Query(None, description="True for linked members only, False for external attendees only"),
    session: Session = Depends(get_session)
):
    return ParticipantService.list_participants_by_event(session, event_id=event_id, linked_member_only=linked_member_only)
