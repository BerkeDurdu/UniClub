import { z } from "zod";

// ── Club ──
export const clubSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  founded_date: z.string().min(1, "Founded date is required"),
});
export type ClubFormValues = z.infer<typeof clubSchema>;

// ── Advisor ──
export const advisorSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  department: z.string().min(1, "Department is required"),
  assigned_date: z.string().min(1, "Assigned date is required"),
  club_id: z
    .number()
    .int()
    .positive()
    .optional(),
});
export type AdvisorFormValues = z.infer<typeof advisorSchema>;

// ── Member ──
export const memberSchema = z.object({
  student_id: z
    .string()
    .min(1, "Student ID is required")
    .regex(/^\w+$/, "Student ID must be alphanumeric"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  department: z.string().min(1, "Department is required"),
  join_date: z.string().min(1, "Join date is required"),
  club_id: z
    .number()
    .int()
    .positive()
    .optional(),
});
export type MemberFormValues = z.infer<typeof memberSchema>;

// ── Board Member ──
export const boardMemberSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(
    ["President", "Vice President", "Secretary", "Treasurer", "Coordinator"],
    { message: "Role is required" },
  ),
  join_date: z.string().min(1, "Join date is required"),
  club_id: z.number().int().positive("Club is required"),
});
export type BoardMemberFormValues = z.infer<typeof boardMemberSchema>;

// ── Venue ──
export const venueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  venue_type: z.string().optional(),
  description: z.string().optional(),
});
export type VenueFormValues = z.infer<typeof venueSchema>;

// ── Event ──
export const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    status: z.enum(["Scheduled", "Completed", "Canceled"]),
    event_start: z.string().min(1, "Event start is required"),
    event_end: z.string().min(1, "Event end is required"),
    club_id: z.number().int().positive(),
    venue_id: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.event_end) <= new Date(value.event_start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["event_end"],
        message: "Event end must be after event start",
      });
    }
  });
export type EventFormValues = z.infer<typeof eventSchema>;

// ── Budget ──
export const budgetSchema = z.object({
  event_id: z.number().int().positive("Event is required"),
  planned_amount: z.number().min(0, "Planned amount must be 0 or greater"),
  actual_amount: z.number().min(0, "Actual amount must be 0 or greater"),
  notes: z.string().optional(),
});
export type BudgetFormValues = z.infer<typeof budgetSchema>;

// ── Registration ──
export const registrationSchema = z.object({
  event_id: z.number().int().positive("Event is required"),
  member_id: z.number().int().positive("Member is required"),
});
export type RegistrationFormValues = z.infer<typeof registrationSchema>;

// ── Message ──
export const messageSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  club_id: z.number().int().positive("Club is required"),
  receiver_user_id: z.number().int().positive("Recipient is required"),
});
export type MessageFormValues = z.infer<typeof messageSchema>;

// ── Sponsorship ──
export const sponsorshipSchema = z.object({
  sponsor_name: z.string().min(1, "Sponsor name is required"),
  amount: z.number().min(0, "Amount must be 0 or greater"),
  agreement_date: z.string().min(1, "Agreement date is required"),
  event_id: z.number().int().positive("Event is required"),
});
export type SponsorshipFormValues = z.infer<typeof sponsorshipSchema>;

// ── Participant ──
export const participantSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  event_id: z.number().int().positive("Event is required"),
  member_id: z
    .number()
    .int()
    .positive()
    .optional(),
});
export type ParticipantFormValues = z.infer<typeof participantSchema>;
