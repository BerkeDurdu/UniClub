from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from schemas import ClubNetworkReport, EventNetworkReport, MemberNetworkReport
from services import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get(
    "/club-network/{club_id}",
    response_model=ClubNetworkReport,
    summary="Get club relationship network",
    description="Returns club with linked advisor, members, board members, events, messages, and counts.",
)
def get_club_network(club_id: int, session: Session = Depends(get_session)):
    return ReportService.get_club_network(session, club_id)


@router.get(
    "/event-network/{event_id}",
    response_model=EventNetworkReport,
    summary="Get event relationship network",
    description="Returns event with linked venue, budget, registrations, participants, sponsorships, and counts.",
)
def get_event_network(event_id: int, session: Session = Depends(get_session)):
    return ReportService.get_event_network(session, event_id)


@router.get(
    "/member-network/{member_id}",
    response_model=MemberNetworkReport,
    summary="Get member relationship network",
    description="Returns member with linked club, messages, registrations, participant records, and counts.",
)
def get_member_network(member_id: int, session: Session = Depends(get_session)):
    return ReportService.get_member_network(session, member_id)
