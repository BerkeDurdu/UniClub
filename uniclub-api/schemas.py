from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from models import EventStatus, BoardRole


class ResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ==========================
# CLUB SCHEMAS
# ==========================
class ClubCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    category: str
    founded_date: date

class ClubResponse(ResponseSchema):
    id: int
    name: str
    description: str
    category: str
    founded_date: date

class ClubUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    founded_date: Optional[date] = None

# ==========================
# ADVISOR SCHEMAS
# ==========================
class AdvisorCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    department: str = Field(..., min_length=1)
    assigned_date: date
    club_id: Optional[int] = None

class AdvisorResponse(ResponseSchema):
    id: int
    full_name: str
    email: EmailStr
    department: str
    assigned_date: date
    club_id: Optional[int] = None

# ==========================
# MEMBER SCHEMAS
# ==========================
class MemberCreate(BaseModel):
    student_id: str = Field(..., min_length=1, pattern=r"^\w+$")
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    department: str = Field(..., min_length=1)
    join_date: date
    club_id: Optional[int] = None

class MemberResponse(ResponseSchema):
    id: int
    student_id: str
    first_name: str
    last_name: str
    email: EmailStr
    department: str
    join_date: date
    leave_date: Optional[date] = None
    club_id: Optional[int] = None

class MemberUpdateLeaveDate(BaseModel):
    leave_date: date

# ==========================
# BOARD MEMBER SCHEMAS
# ==========================
class BoardMemberCreate(BaseModel):
    student_id: str = Field(..., min_length=1)
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    role: BoardRole
    join_date: date
    club_id: int

class BoardMemberResponse(ResponseSchema):
    id: int
    student_id: str
    first_name: str
    last_name: str
    email: EmailStr
    role: BoardRole
    join_date: date
    leave_date: Optional[date] = None
    club_id: int

# ==========================
# VENUE SCHEMAS
# ==========================
class VenueCreate(BaseModel):
    name: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    capacity: int = Field(..., gt=0)
    venue_type: Optional[str] = None
    description: Optional[str] = None

class VenueResponse(ResponseSchema):
    id: int
    name: str
    location: str
    capacity: int
    venue_type: Optional[str] = None
    description: Optional[str] = None

# ==========================
# EVENT SCHEMAS
# ==========================
class EventCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    status: EventStatus
    event_start: datetime
    event_end: datetime
    club_id: int
    venue_id: Optional[int] = None

class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, min_length=1)
    status: Optional[EventStatus] = None
    event_start: Optional[datetime] = None
    event_end: Optional[datetime] = None
    club_id: Optional[int] = None
    venue_id: Optional[int] = None

class EventResponse(ResponseSchema):
    id: int
    title: str
    description: str
    status: EventStatus
    event_start: datetime
    event_end: datetime
    club_id: int
    venue_id: Optional[int] = None

# ==========================
# BUDGET SCHEMAS
# ==========================
class BudgetCreate(BaseModel):
    event_id: int
    planned_amount: float = Field(..., ge=0)
    actual_amount: float = Field(..., ge=0)
    notes: Optional[str] = None

class BudgetResponse(ResponseSchema):
    id: int
    event_id: int
    planned_amount: float
    actual_amount: float
    notes: Optional[str] = None

class BudgetUpdate(BaseModel):
    planned_amount: Optional[float] = Field(None, ge=0)
    actual_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

# ==========================
# REGISTRATION SCHEMAS
# ==========================
class RegistrationCreate(BaseModel):
    event_id: int
    member_id: int
    registered_at: Optional[datetime] = None

class RegistrationResponse(ResponseSchema):
    id: int
    event_id: int
    member_id: int
    registered_at: datetime

# ==========================
# PARTICIPANT SCHEMAS
# ==========================
class ParticipantCreate(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    event_id: int
    member_id: Optional[int] = None
    checked_in_at: Optional[datetime] = None

class ParticipantResponse(ResponseSchema):
    id: int
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    event_id: int
    member_id: Optional[int] = None
    checked_in_at: Optional[datetime] = None

# ==========================
# MESSAGE SCHEMAS
# ==========================
class MessageCreate(BaseModel):
    subject: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    club_id: int
    member_id: int
    sent_at: Optional[datetime] = None

class MessageResponse(ResponseSchema):
    id: int
    subject: str
    content: str
    club_id: int
    member_id: int
    sent_at: datetime

# ==========================
# SPONSORSHIP SCHEMAS
# ==========================
class SponsorshipCreate(BaseModel):
    sponsor_name: str = Field(..., min_length=1)
    amount: float = Field(..., ge=0)
    agreement_date: date
    event_id: int

class SponsorshipResponse(ResponseSchema):
    id: int
    sponsor_name: str
    amount: float
    agreement_date: date
    event_id: int


# ==========================
# REPORT SCHEMAS
# ==========================
class ClubNetworkReport(ResponseSchema):
    club: ClubResponse
    advisor: Optional[AdvisorResponse] = None
    members: List[MemberResponse]
    board_members: List[BoardMemberResponse]
    events: List[EventResponse]
    messages: List[MessageResponse]
    counts: dict[str, int]


class EventNetworkReport(ResponseSchema):
    event: EventResponse
    venue: Optional[VenueResponse] = None
    budget: Optional[BudgetResponse] = None
    registrations: List[RegistrationResponse]
    participants: List[ParticipantResponse]
    sponsorships: List[SponsorshipResponse]
    counts: dict[str, int]


class MemberNetworkReport(ResponseSchema):
    member: MemberResponse
    club: Optional[ClubResponse] = None
    messages: List[MessageResponse]
    registrations: List[RegistrationResponse]
    participant_records: List[ParticipantResponse]
    counts: dict[str, int]
