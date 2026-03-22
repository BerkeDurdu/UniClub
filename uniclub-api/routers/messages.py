from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import MessageCreate, MessageResponse, MessageRecipientOption
from services import MessageService
from models import User, UserRole
from auth import get_current_user, require_roles, require_same_club_or_forbid

router = APIRouter(tags=["Messages"])

# Auth required — any role
@router.get("/messages", response_model=List[MessageResponse], summary="List all messages")
def list_messages(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.club_id is None:
        return []
    messages = MessageService.list_messages_by_club(session, current_user.club_id)
    return [MessageService.serialize_message(session, msg) for msg in messages]

# Auth required — any role
@router.get("/clubs/{club_id}/messages", response_model=List[MessageResponse], summary="List messages by club")
def list_messages_by_club(club_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    require_same_club_or_forbid(club_id, current_user)
    messages = MessageService.list_messages_by_club(session, club_id)
    return [MessageService.serialize_message(session, msg) for msg in messages]


@router.get("/messages/recipient-options", response_model=List[MessageRecipientOption], summary="List allowed message recipients")
def list_message_recipients(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return MessageService.recipient_options(session, current_user)

# Protected — any authenticated user can create messages in their own club
@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED, summary="Create a message")
def create_message(
    data: MessageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    msg = MessageService.create_message(session, data, current_user)
    return MessageService.serialize_message(session, msg)

# Protected — advisor/board_member, own club only
@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a message")
def delete_message(
    message_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    msg = MessageService.get_message(session, message_id)
    require_same_club_or_forbid(msg.club_id, current_user)
    session.delete(msg)
    session.commit()
