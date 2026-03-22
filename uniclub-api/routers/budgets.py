from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from database import get_session
from schemas import BudgetCreate, BudgetResponse, BudgetUpdate
from services import BudgetService, EventService
from models import User, UserRole
from auth import get_current_user, require_roles, require_same_club_or_forbid

router = APIRouter(prefix="/budgets", tags=["Budgets"])

# Auth required — any role
@router.get("/{event_id}", response_model=BudgetResponse, summary="Get budget by event ID")
def get_budget_by_event(event_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return BudgetService.get_budget_by_event(session, event_id)

# Protected — advisor/board_member, own club events only
@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED, summary="Create a new budget")
def create_budget(
    data: BudgetCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    event = EventService.get_event(session, data.event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    return BudgetService.create_budget(session, data)

# Protected — advisor/board_member, own club events only
@router.put("/{event_id}", response_model=BudgetResponse, summary="Update budget by event ID")
def update_budget(
    event_id: int,
    data: BudgetUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    event = EventService.get_event(session, event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    return BudgetService.update_budget(session, event_id, data)

# Protected — advisor/board_member, own club events only
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete budget by event ID")
def delete_budget(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    event = EventService.get_event(session, event_id)
    require_same_club_or_forbid(event.club_id, current_user)
    budget = BudgetService.get_budget_by_event(session, event_id)
    session.delete(budget)
    session.commit()
