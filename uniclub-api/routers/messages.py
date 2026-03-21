from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import MessageCreate, MessageResponse
from services import MessageService

router = APIRouter(tags=["Messages"])

@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED, summary="Create a message")
def create_message(data: MessageCreate, session: Session = Depends(get_session)):
    return MessageService.create_message(session, data)

@router.get("/messages", response_model=List[MessageResponse], summary="List all messages")
def list_messages(session: Session = Depends(get_session)):
    return MessageService.list_messages(session)

@router.get("/clubs/{club_id}/messages", response_model=List[MessageResponse], summary="List messages by club")
def list_messages_by_club(club_id: int, session: Session = Depends(get_session)):
    return MessageService.list_messages_by_club(session, club_id)
