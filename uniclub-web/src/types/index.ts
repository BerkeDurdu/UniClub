export type EventStatus = "Scheduled" | "Completed" | "Canceled";

export type BoardRole =
  | "President"
  | "Vice President"
  | "Secretary"
  | "Treasurer"
  | "Coordinator";

export type UserRole = "member" | "advisor" | "board_member";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  clubId: number | null;
  isActive: boolean;
  createdAt: string;
}

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
  sender_user_id: number;
  receiver_user_id: number;
  sent_at: string;
  sender_name: string | null;
  sender_role: UserRole | null;
  receiver_name: string | null;
  receiver_role: UserRole | null;
}

export interface MessageRecipientOption {
  id: number;
  full_name: string;
  role: UserRole;
  club_id: number | null;
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

export interface ManualClubOnboardingDraft {
  club_id: number;
  club_name: string;
  category: string;
  description: string;
  founded_date: string;
  contact_email: string;
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
  phone?: string;
  event_id: number;
  member_id?: number;
  checked_in_at?: string;
}

// ── Advisor Payloads ──
export interface AdvisorCreatePayload {
  full_name: string;
  email: string;
  department: string;
  assigned_date: string;
  club_id?: number;
}

export interface AdvisorUpdatePayload {
  full_name?: string;
  email?: string;
  department?: string;
  assigned_date?: string;
  club_id?: number;
}

// ── Member Payloads ──
export interface MemberCreatePayload {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  join_date: string;
  club_id?: number;
}

export interface MemberUpdatePayload {
  student_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  department?: string;
  join_date?: string;
  leave_date?: string;
  club_id?: number;
}

// ── Board Member Payloads ──
export interface BoardMemberCreatePayload {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: BoardRole;
  join_date: string;
  club_id: number;
}

export interface BoardMemberUpdatePayload {
  student_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: BoardRole;
  join_date?: string;
  club_id?: number;
}

// ── Venue Payloads ──
export interface VenueCreatePayload {
  name: string;
  location: string;
  capacity: number;
  venue_type?: string;
  description?: string;
}

export interface VenueUpdatePayload {
  name?: string;
  location?: string;
  capacity?: number;
  venue_type?: string;
  description?: string;
}

// ── Event Update Payload ──
export interface EventUpdatePayload {
  title?: string;
  description?: string;
  status?: EventStatus;
  event_start?: string;
  event_end?: string;
  club_id?: number;
  venue_id?: number;
}

// ── Budget Payloads ──
export interface BudgetCreatePayload {
  event_id: number;
  planned_amount: number;
  actual_amount: number;
  notes?: string;
}

export interface BudgetUpdatePayload {
  planned_amount?: number;
  actual_amount?: number;
  notes?: string;
}

// ── Registration Payload ──
export interface RegistrationCreatePayload {
  event_id: number;
  member_id: number;
  registered_at?: string;
}

// ── Message Payload ──
export interface MessageCreatePayload {
  subject: string;
  content: string;
  club_id: number;
  receiver_user_id: number;
  sent_at?: string;
}

// ── Sponsorship Payload ──
export interface SponsorshipCreatePayload {
  sponsor_name: string;
  amount: number;
  agreement_date: string;
  event_id: number;
}

// ── Club Update Payload ──
export interface ClubUpdatePayload {
  name?: string;
  description?: string;
  category?: string;
  founded_date?: string;
}

// ── Report Types ──
export interface ClubNetworkReport {
  club: Club;
  advisor: Advisor | null;
  members: Member[];
  board_members: BoardMember[];
  events: Event[];
  messages: Message[];
  counts: Record<string, number>;
}

export interface EventNetworkReport {
  event: Event;
  venue: Venue | null;
  budget: Budget | null;
  registrations: Registration[];
  participants: Participant[];
  sponsorships: Sponsorship[];
  counts: Record<string, number>;
}

export interface MemberNetworkReport {
  member: Member;
  club: Club | null;
  messages: Message[];
  registrations: Registration[];
  participant_records: Participant[];
  counts: Record<string, number>;
}
