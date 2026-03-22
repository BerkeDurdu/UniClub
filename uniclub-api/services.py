from sqlmodel import Session, select, or_
from fastapi import HTTPException
from models import (
    Club, Advisor, Member, BoardMember, Venue, Event, Message,
    Registration, Sponsorship, Budget, Participant, EventStatus, BoardRole, User, UserRole
)
from schemas import (
    ClubCreate, ClubUpdate, AdvisorCreate, MemberCreate, MemberUpdateLeaveDate,
    BoardMemberCreate, VenueCreate, EventCreate, EventUpdate, BudgetCreate, BudgetUpdate,
    RegistrationCreate, ParticipantCreate, MessageCreate, SponsorshipCreate
)
from datetime import datetime
from typing import Optional

class ClubService:
    @staticmethod
    def create_club(session: Session, data: ClubCreate) -> Club:
        if not data.name.strip() or not data.description.strip():
            raise HTTPException(status_code=400, detail="Club name and description cannot be blank")
        existing = session.exec(select(Club).where(Club.name == data.name)).first()
        if existing:
            raise HTTPException(status_code=409, detail="Club with this name already exists")
        db_obj = Club(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_club(session: Session, club_id: int) -> Club:
        club = session.get(Club, club_id)
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        return club

    @staticmethod
    def list_clubs(session: Session, category: Optional[str] = None, search: Optional[str] = None, skip: int = 0, limit: int = 100) -> list[Club]:
        query = select(Club)
        if category:
            query = query.where(Club.category == category)
        if search:
            query = query.where(Club.name.ilike(f"%{search}%"))
        query = query.offset(skip).limit(limit)
        return session.exec(query).all()

    @staticmethod
    def delete_club(session: Session, club_id: int) -> None:
        club = ClubService.get_club(session, club_id)
        session.delete(club)
        session.commit()


class AdvisorService:
    @staticmethod
    def create_advisor(session: Session, data: AdvisorCreate) -> Advisor:
        existing = session.exec(select(Advisor).where(Advisor.email == data.email)).first()
        if existing:
            raise HTTPException(status_code=409, detail="Advisor email must be unique")

        if data.club_id is not None and not session.get(Club, data.club_id):
            raise HTTPException(status_code=404, detail="Club not found")
        
        if data.club_id:
            existing_adv = session.exec(select(Advisor).where(Advisor.club_id == data.club_id)).first()
            if existing_adv:
                raise HTTPException(status_code=409, detail="Club already has an active advisor")

        db_obj = Advisor(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def assign_advisor(session: Session, advisor_id: int, club_id: int) -> Advisor:
        advisor = session.get(Advisor, advisor_id)
        if not advisor:
            raise HTTPException(status_code=404, detail="Advisor not found")
            
        if advisor.club_id and advisor.club_id != club_id:
            raise HTTPException(status_code=409, detail="Advisor is already advising another club")

        existing_adv = session.exec(select(Advisor).where(Advisor.club_id == club_id, Advisor.id != advisor_id)).first()
        if existing_adv:
            raise HTTPException(status_code=409, detail="Club already has an active advisor")

        advisor.club_id = club_id
        session.add(advisor)
        session.commit()
        session.refresh(advisor)
        return advisor

    @staticmethod
    def get_advisor(session: Session, advisor_id: int) -> Advisor:
        advisor = session.get(Advisor, advisor_id)
        if not advisor:
            raise HTTPException(status_code=404, detail="Advisor not found")
        return advisor

    @staticmethod
    def list_advisors(session: Session) -> list[Advisor]:
        return session.exec(select(Advisor)).all()


class MemberService:
    @staticmethod
    def create_member(session: Session, data: MemberCreate) -> Member:
        existing_student = session.exec(select(Member).where(Member.student_id == data.student_id)).first()
        if existing_student:
             raise HTTPException(status_code=409, detail="Student ID already exists")
             
        existing_email = session.exec(select(Member).where(Member.email == data.email)).first()
        if existing_email:
             raise HTTPException(status_code=409, detail="Email already exists")

        if data.club_id is not None and not session.get(Club, data.club_id):
            raise HTTPException(status_code=404, detail="Club not found")

        db_obj = Member(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_member(session: Session, member_id: int) -> Member:
        member = session.get(Member, member_id)
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        return member

    @staticmethod
    def list_members(session: Session, department: Optional[str] = None, club_id: Optional[int] = None, search: Optional[str] = None, skip: int = 0, limit: int = 100) -> list[Member]:
        query = select(Member)
        if department:
            query = query.where(Member.department == department)
        if club_id:
            query = query.where(Member.club_id == club_id)
        if search:
            query = query.where(or_(
                Member.first_name.ilike(f"%{search}%"),
                Member.last_name.ilike(f"%{search}%"),
                Member.student_id.ilike(f"%{search}%")
            ))
        query = query.offset(skip).limit(limit)
        return session.exec(query).all()

    @staticmethod
    def assign_to_club(session: Session, member_id: int, club_id: int) -> Member:
        member = MemberService.get_member(session, member_id)
        club = ClubService.get_club(session, club_id)
        member.club_id = club.id
        session.add(member)
        session.commit()
        session.refresh(member)
        return member

    @staticmethod
    def update_leave_date(session: Session, member_id: int, data: MemberUpdateLeaveDate) -> Member:
        member = MemberService.get_member(session, member_id)
        if data.leave_date < member.join_date:
            raise HTTPException(status_code=400, detail="Leave date cannot be earlier than join date")
        member.leave_date = data.leave_date
        session.add(member)
        session.commit()
        session.refresh(member)
        return member


class BoardMemberService:
    @staticmethod
    def create_board_member(session: Session, data: BoardMemberCreate) -> BoardMember:
        if data.role not in [
            BoardRole.President,
            BoardRole.Vice_President,
            BoardRole.Secretary,
            BoardRole.Treasurer,
            BoardRole.Coordinator,
        ]:
            raise HTTPException(status_code=400, detail="Invalid role")
        club = session.get(Club, data.club_id)
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
            
        active_boards = session.exec(select(BoardMember).where(BoardMember.student_id == data.student_id, BoardMember.leave_date == None)).all()
        if active_boards:
            raise HTTPException(status_code=409, detail="Student is already an active board member in a club")
            
        if data.role == BoardRole.President:
            active_presidents = session.exec(select(BoardMember).where(BoardMember.club_id == data.club_id, BoardMember.role == BoardRole.President, BoardMember.leave_date == None)).all()
            if active_presidents:
                raise HTTPException(status_code=409, detail="Club already has an active President")

        db_obj = BoardMember(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_board_member(session: Session, board_member_id: int) -> BoardMember:
        bm = session.get(BoardMember, board_member_id)
        if not bm:
            raise HTTPException(status_code=404, detail="Board member not found")
        return bm

    @staticmethod
    def list_board_members(session: Session) -> list[BoardMember]:
        return session.exec(select(BoardMember)).all()


class VenueService:
    @staticmethod
    def create_venue(session: Session, data: VenueCreate) -> Venue:
        db_obj = Venue(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_venue(session: Session, venue_id: int) -> Venue:
        venue = session.get(Venue, venue_id)
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
        return venue

    @staticmethod
    def list_venues(session: Session) -> list[Venue]:
        return session.exec(select(Venue)).all()


class EventService:
    @staticmethod
    def create_event(session: Session, data: EventCreate) -> Event:
        if not data.title.strip() or not data.description.strip():
            raise HTTPException(status_code=400, detail="Event title and description cannot be blank")

        if data.status not in [EventStatus.Scheduled, EventStatus.Completed, EventStatus.Canceled]:
            raise HTTPException(status_code=400, detail="Invalid status")

        if not session.get(Club, data.club_id):
            raise HTTPException(status_code=404, detail="Club not found")

        if data.venue_id is not None and not session.get(Venue, data.venue_id):
            raise HTTPException(status_code=404, detail="Venue not found")
            
        if data.event_end < data.event_start:
            raise HTTPException(status_code=400, detail="Event end cannot be before event start")
            
        existing_event = session.exec(select(Event).where(Event.club_id == data.club_id, Event.title == data.title, Event.event_start == data.event_start)).first()
        if existing_event:
            raise HTTPException(status_code=409, detail="Duplicate event in the same club with the same title and start time")

        db_obj = Event(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_event(session: Session, event_id: int) -> Event:
        event = session.get(Event, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event

    @staticmethod
    def list_events(session: Session, status: Optional[str] = None, club_id: Optional[int] = None, venue_id: Optional[int] = None, upcoming_only: bool = False, sort_by: str = "event_start", skip: int = 0, limit: int = 100) -> list[Event]:
        query = select(Event)
        if status:
            query = query.where(Event.status == status)
        if club_id:
            query = query.where(Event.club_id == club_id)
        if venue_id:
            query = query.where(Event.venue_id == venue_id)
        if upcoming_only:
            query = query.where(Event.event_start >= datetime.now())
            
        if sort_by not in ["event_start", "event_end", "title"]:
             raise HTTPException(status_code=400, detail="Invalid sort_by field")
             
        if sort_by == "event_start":
            query = query.order_by(Event.event_start)
        elif sort_by == "event_end":
            query = query.order_by(Event.event_end)
        elif sort_by == "title":
            query = query.order_by(Event.title)
            
        query = query.offset(skip).limit(limit)
        return session.exec(query).all()

    @staticmethod
    def update_event(session: Session, event_id: int, data: EventUpdate) -> Event:
        event = EventService.get_event(session, event_id)
        update_data = data.model_dump(exclude_unset=True)
        if "status" in update_data and update_data["status"] not in [EventStatus.Scheduled, EventStatus.Completed, EventStatus.Canceled]:
            raise HTTPException(status_code=400, detail="Invalid status")
        if "title" in update_data and not str(update_data["title"]).strip():
            raise HTTPException(status_code=400, detail="Event title cannot be blank")
        if "description" in update_data and not str(update_data["description"]).strip():
            raise HTTPException(status_code=400, detail="Event description cannot be blank")
        if "club_id" in update_data and not session.get(Club, update_data["club_id"]):
            raise HTTPException(status_code=404, detail="Club not found")
        if "venue_id" in update_data and update_data["venue_id"] is not None and not session.get(Venue, update_data["venue_id"]):
            raise HTTPException(status_code=404, detail="Venue not found")
        new_start = update_data.get("event_start", event.event_start)
        new_end = update_data.get("event_end", event.event_end)
        if new_end < new_start:
            raise HTTPException(status_code=400, detail="Event end cannot be before event start")
        for key, value in update_data.items():
            setattr(event, key, value)
        session.add(event)
        session.commit()
        session.refresh(event)
        return event

    @staticmethod
    def delete_event(session: Session, event_id: int) -> None:
        event = EventService.get_event(session, event_id)
        session.delete(event)
        session.commit()


class BudgetService:
    @staticmethod
    def create_budget(session: Session, data: BudgetCreate) -> Budget:
        if not session.get(Event, data.event_id):
            raise HTTPException(status_code=404, detail="Event not found")
        existing = session.exec(select(Budget).where(Budget.event_id == data.event_id)).first()
        if existing:
            raise HTTPException(status_code=409, detail="Event already has a budget")
        if data.planned_amount < 0 or data.actual_amount < 0:
            raise HTTPException(status_code=400, detail="Budget amounts cannot be negative")

        db_obj = Budget(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_budget_by_event(session: Session, event_id: int) -> Budget:
        budget = session.exec(select(Budget).where(Budget.event_id == event_id)).first()
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found for event")
        return budget

    @staticmethod
    def update_budget(session: Session, event_id: int, data: BudgetUpdate) -> Budget:
        budget = BudgetService.get_budget_by_event(session, event_id)
        update_data = data.model_dump(exclude_unset=True)
        if "planned_amount" in update_data and update_data["planned_amount"] < 0:
            raise HTTPException(status_code=400, detail="Planned amount cannot be negative")
        if "actual_amount" in update_data and update_data["actual_amount"] < 0:
            raise HTTPException(status_code=400, detail="Actual amount cannot be negative")
        for key, value in update_data.items():
            setattr(budget, key, value)
        session.add(budget)
        session.commit()
        session.refresh(budget)
        return budget


class RegistrationService:
    @staticmethod
    def register_member(session: Session, data: RegistrationCreate) -> Registration:
        member = session.get(Member, data.member_id)
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        event = session.get(Event, data.event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        if event.status in [EventStatus.Canceled, EventStatus.Completed]:
            raise HTTPException(status_code=400, detail="Cannot register for an event that is canceled or completed")
        if event.event_start.replace(tzinfo=None) < datetime.now().replace(tzinfo=None):
            raise HTTPException(status_code=400, detail="Cannot register for a past event")

        existing_reg = session.exec(select(Registration).where(Registration.event_id == data.event_id, Registration.member_id == data.member_id)).first()
        if existing_reg:
            raise HTTPException(status_code=409, detail="Member already registered for this event")
            
        if event.venue_id:
            venue = session.get(Venue, event.venue_id)
            if venue:
                reg_count = len(session.exec(select(Registration).where(Registration.event_id == data.event_id)).all())
                if reg_count >= venue.capacity:
                    raise HTTPException(status_code=400, detail="Registration full. Venue capacity reached.")

        db_obj = Registration(**data.model_dump(exclude={"registered_at"}))
        db_obj.registered_at = data.registered_at or datetime.now()
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def list_registrations(session: Session, event_id: Optional[int] = None, member_id: Optional[int] = None) -> list[Registration]:
        query = select(Registration)
        if event_id is not None:
             query = query.where(Registration.event_id == event_id)
        if member_id is not None:
             query = query.where(Registration.member_id == member_id)
        return session.exec(query).all()


class ParticipantService:
    @staticmethod
    def add_participant(session: Session, data: ParticipantCreate) -> Participant:
        if not data.first_name.strip() or not data.last_name.strip():
            raise HTTPException(status_code=400, detail="Participant first and last names cannot be blank")

        event = session.get(Event, data.event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        if data.member_id:
            member = session.get(Member, data.member_id)
            if not member:
                raise HTTPException(status_code=404, detail="Member not found")
            existing = session.exec(select(Participant).where(Participant.event_id == data.event_id, Participant.member_id == data.member_id)).first()
            if existing:
                raise HTTPException(status_code=409, detail="Member is already a participant in this event")
        
        if not data.member_id and data.email:
             existing = session.exec(select(Participant).where(Participant.event_id == data.event_id, Participant.email == data.email)).first()
             if existing:
                 raise HTTPException(status_code=409, detail="Participant with this email already exists in this event")
                 
        if event.venue_id:
             venue = session.get(Venue, event.venue_id)
             if venue:
                 part_count = len(session.exec(select(Participant).where(Participant.event_id == data.event_id)).all())
                 if part_count >= venue.capacity:
                     raise HTTPException(status_code=400, detail="Participant limit reached for venue capacity")

        db_obj = Participant(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def list_participants_by_event(session: Session, event_id: int, linked_member_only: Optional[bool] = None) -> list[Participant]:
        query = select(Participant).where(Participant.event_id == event_id)
        if linked_member_only is True:
             query = query.where(Participant.member_id != None)
        elif linked_member_only is False:
             query = query.where(Participant.member_id == None)
        return session.exec(query).all()


class MessageService:
    @staticmethod
    def create_message(session: Session, data: MessageCreate, sender_user: User) -> Message:
        if not data.subject.strip() or not data.content.strip():
            raise HTTPException(status_code=400, detail="Message subject and content cannot be blank")

        if sender_user.club_id is None:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        if sender_user.club_id != data.club_id:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        club = session.get(Club, data.club_id)
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")

        receiver = session.get(User, data.receiver_user_id)
        if not receiver:
            raise HTTPException(status_code=404, detail="Recipient user not found")
        if receiver.id == sender_user.id:
            raise HTTPException(status_code=400, detail="You cannot send messages to yourself")
        if receiver.club_id != data.club_id:
            raise HTTPException(status_code=400, detail="Recipient must belong to the selected club")

        sender_role = sender_user.role if isinstance(sender_user.role, UserRole) else UserRole(sender_user.role)
        receiver_role = receiver.role if isinstance(receiver.role, UserRole) else UserRole(receiver.role)

        if sender_role == UserRole.member:
            if receiver_role not in {UserRole.advisor, UserRole.board_member}:
                raise HTTPException(status_code=403, detail="Members can only message advisors or board members")
        elif sender_role in {UserRole.advisor, UserRole.board_member}:
            if receiver_role not in {UserRole.advisor, UserRole.board_member}:
                raise HTTPException(status_code=403, detail="Advisors and board members can only message advisors or board members")
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        db_obj = Message(**data.model_dump(exclude={"sent_at"}))
        db_obj.sender_user_id = sender_user.id
        db_obj.member_id = None
        db_obj.sent_at = data.sent_at or datetime.now()
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_message(session: Session, msg_id: int) -> Message:
        msg = session.get(Message, msg_id)
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        return msg

    @staticmethod
    def list_messages(session: Session) -> list[Message]:
        return session.exec(select(Message)).all()

    @staticmethod
    def list_messages_by_club(session: Session, club_id: int) -> list[Message]:
        return session.exec(select(Message).where(Message.club_id == club_id)).all()

    @staticmethod
    def serialize_message(session: Session, msg: Message) -> dict:
        sender = session.get(User, msg.sender_user_id)
        receiver = session.get(User, msg.receiver_user_id)
        return {
            "id": msg.id,
            "subject": msg.subject,
            "content": msg.content,
            "club_id": msg.club_id,
            "sender_user_id": msg.sender_user_id,
            "receiver_user_id": msg.receiver_user_id,
            "sent_at": msg.sent_at,
            "sender_name": sender.full_name if sender else None,
            "sender_role": sender.role if sender else None,
            "receiver_name": receiver.full_name if receiver else None,
            "receiver_role": receiver.role if receiver else None,
        }

    @staticmethod
    def recipient_options(session: Session, current_user: User) -> list[User]:
        current_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
        if current_user.club_id is None:
            return []

        query = select(User).where(
            User.club_id == current_user.club_id,
            User.is_active == True,
            User.id != current_user.id,
        )

        if current_role in {UserRole.member, UserRole.advisor, UserRole.board_member}:
            query = query.where(User.role.in_([UserRole.advisor, UserRole.board_member]))
        else:
            return []

        return session.exec(query).all()


class SponsorshipService:
    @staticmethod
    def create_sponsorship(session: Session, data: SponsorshipCreate) -> Sponsorship:
        if not data.sponsor_name.strip():
            raise HTTPException(status_code=400, detail="Sponsor name cannot be blank")
        event = session.get(Event, data.event_id)
        if not event:
             raise HTTPException(status_code=404, detail="Event not found")
        if event.status in [EventStatus.Completed, EventStatus.Canceled] or event.event_end.replace(tzinfo=None) < datetime.now().replace(tzinfo=None):
             raise HTTPException(status_code=400, detail="Cannot create sponsorship for completed or past events")

        db_obj = Sponsorship(**data.model_dump())
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_sponsorship(session: Session, sponsorship_id: int) -> Sponsorship:
        sp = session.get(Sponsorship, sponsorship_id)
        if not sp:
            raise HTTPException(status_code=404, detail="Sponsorship not found")
        return sp

    @staticmethod
    def list_sponsorships(session: Session) -> list[Sponsorship]:
        return session.exec(select(Sponsorship)).all()

    @staticmethod
    def list_sponsorships_by_event(session: Session, event_id: int) -> list[Sponsorship]:
        return session.exec(select(Sponsorship).where(Sponsorship.event_id == event_id)).all()


class ReportService:
    @staticmethod
    def get_club_network(session: Session, club_id: int) -> dict:
        club = ClubService.get_club(session, club_id)
        advisor = session.exec(select(Advisor).where(Advisor.club_id == club_id)).first()
        members = session.exec(select(Member).where(Member.club_id == club_id)).all()
        board_members = session.exec(select(BoardMember).where(BoardMember.club_id == club_id)).all()
        events = session.exec(select(Event).where(Event.club_id == club_id)).all()
        messages = session.exec(select(Message).where(Message.club_id == club_id)).all()

        return {
            "club": club,
            "advisor": advisor,
            "members": members,
            "board_members": board_members,
            "events": events,
            "messages": messages,
            "counts": {
                "members": len(members),
                "board_members": len(board_members),
                "events": len(events),
                "messages": len(messages),
            },
        }

    @staticmethod
    def get_event_network(session: Session, event_id: int) -> dict:
        event = EventService.get_event(session, event_id)
        venue = session.get(Venue, event.venue_id) if event.venue_id else None
        budget = session.exec(select(Budget).where(Budget.event_id == event_id)).first()
        registrations = session.exec(select(Registration).where(Registration.event_id == event_id)).all()
        participants = session.exec(select(Participant).where(Participant.event_id == event_id)).all()
        sponsorships = session.exec(select(Sponsorship).where(Sponsorship.event_id == event_id)).all()

        return {
            "event": event,
            "venue": venue,
            "budget": budget,
            "registrations": registrations,
            "participants": participants,
            "sponsorships": sponsorships,
            "counts": {
                "registrations": len(registrations),
                "participants": len(participants),
                "sponsorships": len(sponsorships),
            },
        }

    @staticmethod
    def get_member_network(session: Session, member_id: int) -> dict:
        member = MemberService.get_member(session, member_id)
        club = session.get(Club, member.club_id) if member.club_id else None
        if member.user_id:
            messages = session.exec(
                select(Message).where(
                    (Message.sender_user_id == member.user_id) | (Message.receiver_user_id == member.user_id)
                )
            ).all()
        else:
            messages = []
        registrations = session.exec(select(Registration).where(Registration.member_id == member_id)).all()
        participant_records = session.exec(select(Participant).where(Participant.member_id == member_id)).all()

        return {
            "member": member,
            "club": club,
            "messages": messages,
            "registrations": registrations,
            "participant_records": participant_records,
            "counts": {
                "messages": len(messages),
                "registrations": len(registrations),
                "participant_records": len(participant_records),
            },
        }
