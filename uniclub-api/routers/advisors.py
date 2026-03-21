from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from database import get_session
from schemas import AdvisorCreate, AdvisorResponse
from services import AdvisorService

router = APIRouter(prefix="/advisors", tags=["Advisors"])

@router.post("", response_model=AdvisorResponse, status_code=status.HTTP_201_CREATED, summary="Create a new advisor")
def create_advisor(data: AdvisorCreate, session: Session = Depends(get_session)):
    return AdvisorService.create_advisor(session, data)

@router.get("", response_model=List[AdvisorResponse], summary="List all advisors")
def list_advisors(session: Session = Depends(get_session)):
    return AdvisorService.list_advisors(session)

@router.get("/{advisor_id}", response_model=AdvisorResponse, summary="Get an advisor by ID")
def get_advisor(advisor_id: int, session: Session = Depends(get_session)):
    return AdvisorService.get_advisor(session, advisor_id)
