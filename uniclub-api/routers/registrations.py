from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session
from typing import List, Optional

from database import get_session
from schemas import RegistrationCreate, RegistrationResponse
from services import RegistrationService

router = APIRouter(prefix="/registrations", tags=["Registrations"])

@router.post("", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED, summary="Register a member to an event")
def register_member(data: RegistrationCreate, session: Session = Depends(get_session)):
    return RegistrationService.register_member(session, data)

@router.get("", response_model=List[RegistrationResponse], summary="List all registrations")
def list_registrations(
    event_id: Optional[int] = Query(None, description="Filter by event ID"),
    member_id: Optional[int] = Query(None, description="Filter by member ID"),
    session: Session = Depends(get_session)
):
    return RegistrationService.list_registrations(session, event_id=event_id, member_id=member_id)
