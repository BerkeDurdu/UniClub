from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlmodel import Session, select
from typing import List, Optional

from database import get_session
from schemas import RegistrationCreate, RegistrationResponse
from services import RegistrationService, EventService
from models import User, UserRole, Member, Registration
from auth import get_current_user, require_roles, require_same_club_or_forbid

router = APIRouter(prefix="/registrations", tags=["Registrations"])

# Auth required — any role
@router.get("", response_model=List[RegistrationResponse], summary="List all registrations")
def list_registrations(
    event_id: Optional[int] = Query(None, description="Filter by event ID"),
    member_id: Optional[int] = Query(None, description="Filter by member ID"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return RegistrationService.list_registrations(session, event_id=event_id, member_id=member_id)

# Protected — members can self-register, advisor/board_member for own club events
@router.post("", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED, summary="Register a member to an event")
def register_member(
    data: RegistrationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)

    if role == UserRole.member:
        # Members can only self-register — member_id must match their linked member record
        member = session.exec(select(Member).where(Member.user_id == current_user.id)).first()
        if not member or member.id != data.member_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only register themselves for events")
    elif role in (UserRole.advisor, UserRole.board_member):
        event = EventService.get_event(session, data.event_id)
        require_same_club_or_forbid(event.club_id, current_user)

    return RegistrationService.register_member(session, data)

# Protected — members can delete own registration, advisor/board_member for own club events
@router.delete("/{registration_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a registration")
def delete_registration(
    registration_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    reg = session.get(Registration, registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)

    if role == UserRole.member:
        member = session.exec(select(Member).where(Member.user_id == current_user.id)).first()
        if not member or member.id != reg.member_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only delete their own registrations")
    elif role in (UserRole.advisor, UserRole.board_member):
        event = EventService.get_event(session, reg.event_id)
        require_same_club_or_forbid(event.club_id, current_user)

    session.delete(reg)
    session.commit()
