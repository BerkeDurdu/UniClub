from datetime import date, datetime
from typing import List, Optional
import enum
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Index, CheckConstraint, text, Column, Enum, UniqueConstraint

class UserRole(str, enum.Enum):
    member = "member"
    advisor = "advisor"
    board_member = "board_member"

class EventStatus(str, enum.Enum):
    Scheduled = "Scheduled"
    Completed = "Completed"
    Canceled = "Canceled"

class BoardRole(str, enum.Enum):
    President = "President"
    Vice_President = "Vice President"
    Secretary = "Secretary"
    Treasurer = "Treasurer"
    Coordinator = "Coordinator"

class User(SQLModel, table=True):
    __tablename__ = "app_user"
    __table_args__ = (
        CheckConstraint("length(trim(full_name)) > 0", name="ck_user_full_name_non_empty"),
        CheckConstraint("(role = 'member') OR (club_id IS NOT NULL)", name="ck_user_role_requires_club"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    role: UserRole = Field(sa_column=Column(Enum(UserRole)))
    club_id: Optional[int] = Field(default=None, foreign_key="club.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.now)

class Club(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: str
    category: str
    founded_date: date
    
    advisor: Optional["Advisor"] = Relationship(back_populates="club")
    members: List["Member"] = Relationship(back_populates="club")
    board_members: List["BoardMember"] = Relationship(back_populates="club")
    events: List["Event"] = Relationship(back_populates="club")
    messages: List["Message"] = Relationship(back_populates="club")

class Advisor(SQLModel, table=True):
    __table_args__ = (
        # Only one advisor assignment per club (Partial Unique Index)
        Index("ix_advisor_one_per_club", "club_id", unique=True, postgresql_where=text("club_id IS NOT NULL")),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str = Field(unique=True, index=True)
    department: str
    assigned_date: date
    
    club_id: Optional[int] = Field(default=None, foreign_key="club.id")
    club: Optional[Club] = Relationship(back_populates="advisor")

    user_id: Optional[int] = Field(default=None, foreign_key="app_user.id", unique=True)

class Member(SQLModel, table=True):
    __table_args__ = (
        CheckConstraint("leave_date IS NULL OR leave_date >= join_date", name="ck_member_leave_date"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: str = Field(unique=True, index=True)
    first_name: str
    last_name: str
    email: str = Field(unique=True, index=True)
    department: str
    join_date: date
    leave_date: Optional[date] = Field(default=None)
    
    club_id: Optional[int] = Field(default=None, foreign_key="club.id")
    club: Optional[Club] = Relationship(back_populates="members")

    user_id: Optional[int] = Field(default=None, foreign_key="app_user.id", unique=True)

    registrations: List["Registration"] = Relationship(back_populates="member")
    participants: List["Participant"] = Relationship(back_populates="member")

class BoardMember(SQLModel, table=True):
    __table_args__ = (
        # Partial unique index to enforce only one active President per club
        Index("ix_one_active_president_per_club", "club_id", "role", unique=True,
              postgresql_where=text("role = 'President' AND leave_date IS NULL")),
        # Enforce reasonable date ranges
        CheckConstraint("leave_date IS NULL OR leave_date >= join_date", name="ck_bm_leave_date"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: str
    first_name: str
    last_name: str
    email: str = Field(unique=True, index=True)
    role: BoardRole = Field(sa_column=Column(Enum(BoardRole)))
    join_date: date
    leave_date: Optional[date] = Field(default=None)
    
    club_id: int = Field(foreign_key="club.id")
    club: Club = Relationship(back_populates="board_members")

    user_id: Optional[int] = Field(default=None, foreign_key="app_user.id", unique=True)

class Venue(SQLModel, table=True):
    __table_args__ = (
        CheckConstraint("capacity > 0", name="ck_venue_capacity_positive"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    location: str
    capacity: int = Field(gt=0)
    venue_type: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    
    events: List["Event"] = Relationship(back_populates="venue")

class Event(SQLModel, table=True):
    __table_args__ = (
        # Indexes for frequent filtering
        Index("ix_event_status", "status"),
        Index("ix_event_start", "event_start"),
        CheckConstraint("event_end >= event_start", name="ck_event_end_after_start"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    status: EventStatus = Field(sa_column=Column(Enum(EventStatus)))
    event_start: datetime
    event_end: datetime
    
    club_id: int = Field(foreign_key="club.id")
    club: Club = Relationship(back_populates="events")
    
    venue_id: Optional[int] = Field(default=None, foreign_key="venue.id")
    venue: Optional[Venue] = Relationship(back_populates="events")
    
    budget: Optional["Budget"] = Relationship(
        sa_relationship_kwargs={"uselist": False},
        back_populates="event"
    )
    registrations: List["Registration"] = Relationship(back_populates="event")
    sponsorships: List["Sponsorship"] = Relationship(back_populates="event")
    participants: List["Participant"] = Relationship(back_populates="event")

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subject: str
    content: str
    sent_at: datetime
    
    club_id: int = Field(foreign_key="club.id")
    club: Club = Relationship(back_populates="messages")

    sender_user_id: int = Field(foreign_key="app_user.id")
    receiver_user_id: int = Field(foreign_key="app_user.id")

    # Legacy column retained to keep compatibility with existing databases.
    member_id: Optional[int] = Field(default=None, foreign_key="member.id")

class Registration(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("event_id", "member_id", name="uq_event_member_registration"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    registered_at: datetime
    
    event_id: int = Field(foreign_key="event.id")
    event: Event = Relationship(back_populates="registrations")
    
    member_id: int = Field(foreign_key="member.id")
    member: Member = Relationship(back_populates="registrations")

class Sponsorship(SQLModel, table=True):
    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_sponsorship_amount_non_negative"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    sponsor_name: str
    amount: float = Field(ge=0)
    agreement_date: date
    
    event_id: int = Field(foreign_key="event.id")
    event: Event = Relationship(back_populates="sponsorships")

class Budget(SQLModel, table=True):
    __table_args__ = (
        CheckConstraint("planned_amount >= 0", name="ck_budget_planned_amount"),
        CheckConstraint("actual_amount >= 0", name="ck_budget_actual_amount"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(unique=True, foreign_key="event.id")
    planned_amount: float = Field(ge=0)
    actual_amount: float = Field(ge=0)
    notes: Optional[str] = Field(default=None)
    
    event: Event = Relationship(back_populates="budget")

class Participant(SQLModel, table=True):
    __table_args__ = (
        # Ensure a member isn't participated twice
        Index("ix_participant_event_member_unique", "event_id", "member_id", unique=True, postgresql_where=text("member_id IS NOT NULL")),
        Index("ix_participant_event_email_unique", "event_id", "email", unique=True, postgresql_where=text("email IS NOT NULL AND member_id IS NULL")),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    email: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    checked_in_at: Optional[datetime] = Field(default=None)
    
    event_id: int = Field(foreign_key="event.id")
    event: Event = Relationship(back_populates="participants")
    
    member_id: Optional[int] = Field(default=None, foreign_key="member.id")
    member: Optional[Member] = Relationship(back_populates="participants")
