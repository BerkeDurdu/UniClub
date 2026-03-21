from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session
from typing import List, Optional

from database import get_session
from schemas import EventCreate, EventResponse, EventUpdate
from services import EventService

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED, summary="Create a new event")
def create_event(data: EventCreate, session: Session = Depends(get_session)):
    return EventService.create_event(session, data)

@router.get("", response_model=List[EventResponse], summary="List all events", description="Get events with optional filtering and pagination.")
def list_events(
    status: Optional[str] = Query(None, description="Filter by status (Scheduled, Completed, Canceled)"),
    club_id: Optional[int] = Query(None, description="Filter by club ID"),
    venue_id: Optional[int] = Query(None, description="Filter by venue ID"),
    upcoming_only: bool = Query(False, description="Returns only events starting in the future"),
    sort_by: str = Query("event_start", description="Sort by event_start, event_end, or title"),
    skip: int = Query(0, description="Records to skip"),
    limit: int = Query(100, description="Max records to return"),
    session: Session = Depends(get_session)
):
    return EventService.list_events(session, status=status, club_id=club_id, venue_id=venue_id, upcoming_only=upcoming_only, sort_by=sort_by, skip=skip, limit=limit)

@router.get("/{event_id}", response_model=EventResponse, summary="Get an event by ID")
def get_event(event_id: int, session: Session = Depends(get_session)):
    return EventService.get_event(session, event_id)

@router.put("/{event_id}", response_model=EventResponse, summary="Update an event")
def update_event(event_id: int, data: EventUpdate, session: Session = Depends(get_session)):
    return EventService.update_event(session, event_id, data)

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an event")
def delete_event(event_id: int, session: Session = Depends(get_session)):
    EventService.delete_event(session, event_id)
