from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from database import get_session
from schemas import BudgetCreate, BudgetResponse, BudgetUpdate
from services import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED, summary="Create a new budget")
def create_budget(data: BudgetCreate, session: Session = Depends(get_session)):
    return BudgetService.create_budget(session, data)

@router.get("/{event_id}", response_model=BudgetResponse, summary="Get budget by event ID")
def get_budget_by_event(event_id: int, session: Session = Depends(get_session)):
    return BudgetService.get_budget_by_event(session, event_id)

@router.put("/{event_id}", response_model=BudgetResponse, summary="Update budget by event ID")
def update_budget(event_id: int, data: BudgetUpdate, session: Session = Depends(get_session)):
    return BudgetService.update_budget(session, event_id, data)
