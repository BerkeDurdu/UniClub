from fastapi import APIRouter, Depends, status, HTTPException
from sqlmodel import Session, select
from typing import List

from database import get_session
from schemas import AdvisorCreate, AdvisorResponse
from services import AdvisorService
from models import User, UserRole, Advisor
from auth import get_current_user, require_roles, require_same_club_or_forbid

router = APIRouter(prefix="/advisors", tags=["Advisors"])

# Auth required — any role
@router.get("", response_model=List[AdvisorResponse], summary="List all advisors")
def list_advisors(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return AdvisorService.list_advisors(session)

# Auth required — any role
@router.get("/{advisor_id}", response_model=AdvisorResponse, summary="Get an advisor by ID")
def get_advisor(advisor_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return AdvisorService.get_advisor(session, advisor_id)

# Protected — advisor/board_member, own club only
@router.post("", response_model=AdvisorResponse, status_code=status.HTTP_201_CREATED, summary="Create a new advisor")
def create_advisor(
    data: AdvisorCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor, UserRole.board_member)),
):
    target_club_id = data.club_id if data.club_id is not None else current_user.club_id
    if target_club_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    require_same_club_or_forbid(target_club_id, current_user)

    payload = data.model_copy(update={"club_id": target_club_id})
    return AdvisorService.create_advisor(session, payload)

# Protected — advisor can update own profile only
@router.put("/{advisor_id}", response_model=AdvisorResponse, summary="Update an advisor profile")
def update_advisor(
    advisor_id: int,
    data: AdvisorCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.advisor)),
):
    advisor = AdvisorService.get_advisor(session, advisor_id)
    if advisor.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions — you can only modify your own profile")

    advisor.full_name = data.full_name
    advisor.email = data.email
    advisor.department = data.department
    advisor.assigned_date = data.assigned_date
    if data.club_id is not None:
        advisor.club_id = data.club_id
    session.add(advisor)
    session.commit()
    session.refresh(advisor)
    return advisor
