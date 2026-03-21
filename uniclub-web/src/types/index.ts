export type EventStatus = "Scheduled" | "Completed" | "Canceled";

export type BoardRole =
  | "President"
  | "Vice President"
  | "Secretary"
  | "Treasurer"
  | "Coordinator";

export interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  founded_date: string;
}

export interface Advisor {
  id: number;
  full_name: string;
  email: string;
  department: string;
  assigned_date: string;
  club_id: number | null;
}

export interface Member {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  join_date: string;
  leave_date: string | null;
  club_id: number | null;
}

export interface BoardMember {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: BoardRole;
  join_date: string;
  leave_date: string | null;
  club_id: number;
}

export interface Venue {
  id: number;
  name: string;
  location: string;
  capacity: number;
  venue_type: string | null;
  description: string | null;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  status: EventStatus;
  event_start: string;
  event_end: string;
  club_id: number;
  venue_id: number | null;
}

export interface Budget {
  id: number;
  event_id: number;
  planned_amount: number;
  actual_amount: number;
  notes: string | null;
}

export interface Registration {
  id: number;
  event_id: number;
  member_id: number;
  registered_at: string;
}

export interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  event_id: number;
  member_id: number | null;
  checked_in_at: string | null;
}

export interface Message {
  id: number;
  subject: string;
  content: string;
  club_id: number;
  member_id: number;
  sent_at: string;
}

export interface Sponsorship {
  id: number;
  sponsor_name: string;
  amount: number;
  agreement_date: string;
  event_id: number;
}

export interface ClubCreatePayload {
  name: string;
  description: string;
  category: string;
  founded_date: string;
}

export interface ClubLocalProfile {
  description?: string;
  category?: string;
  founded_date?: string;
  contact_email?: string;
  contact_phone?: string;
  communication_channel?: string;
  social_link?: string;
  sponsor_contact_name?: string;
  sponsor_contact_role?: string;
}

export interface EventCreatePayload {
  title: string;
  description: string;
  status: EventStatus;
  event_start: string;
  event_end: string;
  club_id: number;
  venue_id?: number;
}

export interface ParticipantCreatePayload {
  first_name: string;
  last_name: string;
  email?: string;
  event_id: number;
}
