Extend the existing UniClub Web frontend with Zod validation schemas and form components for all 11 entities. Keep all existing code intact.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing files in place.
- Keep TypeScript strict mode.
- Validation rules must match backend Pydantic schemas exactly.
- Use React Hook Form + Zod (already in the project).
- Keep existing ClubForm, EventForm, ParticipantForm unchanged unless fixing bugs.

GOAL:
Every entity that can be created from the frontend must have a Zod validation schema and a reusable form component. Currently only Club, Event, and Participant have forms. Add forms for the remaining 8 entities.

1) CREATE ZOD VALIDATION SCHEMAS (`src/validation/schemas.ts`)
Create a new file with Zod schemas for all 11 entities matching backend validation:

clubSchema:
- name: string, min 1 char, required
- description: string, min 1 char, required
- category: string, required
- founded_date: string (date format), required

advisorSchema:
- full_name: string, min 1 char, required
- email: string, valid email, required
- department: string, min 1 char, required
- assigned_date: string (date format), required
- club_id: number, optional

memberSchema:
- student_id: string, min 1 char, alphanumeric pattern (^\w+$), required
- first_name: string, min 1 char, required
- last_name: string, min 1 char, required
- email: string, valid email, required
- department: string, min 1 char, required
- join_date: string (date format), required
- club_id: number, optional

boardMemberSchema:
- student_id: string, min 1 char, required
- first_name: string, min 1 char, required
- last_name: string, min 1 char, required
- email: string, valid email, required
- role: enum (President, Vice President, Secretary, Treasurer, Coordinator), required
- join_date: string (date format), required
- club_id: number, required

venueSchema:
- name: string, min 1 char, required
- location: string, min 1 char, required
- capacity: number, positive (> 0), required
- venue_type: string, optional
- description: string, optional

eventSchema:
- title: string, min 1 char, required
- description: string, min 1 char, required
- status: enum (Scheduled, Completed, Canceled), required
- event_start: string (datetime), required
- event_end: string (datetime), required, must be >= event_start
- club_id: number, required
- venue_id: number, optional

budgetSchema:
- event_id: number, required
- planned_amount: number, >= 0, required
- actual_amount: number, >= 0, required
- notes: string, optional

registrationSchema:
- event_id: number, required
- member_id: number, required

messageSchema:
- subject: string, min 1 char, required
- content: string, min 1 char, required
- club_id: number, required
- member_id: number, required

sponsorshipSchema:
- sponsor_name: string, min 1 char, required
- amount: number, >= 0, required
- agreement_date: string (date format), required
- event_id: number, required

participantSchema:
- first_name: string, min 1 char, required
- last_name: string, min 1 char, required
- email: string, valid email, optional (allow empty)
- phone: string, optional
- event_id: number, required
- member_id: number, optional

2) CREATE FORM COMPONENTS
Create form components in `src/components/forms/` for missing entities:

AdvisorForm.tsx:
- Fields: full_name, email, department, assigned_date (date picker), club_id (dropdown from clubs API)
- Uses advisorSchema for validation
- onSubmit callback with typed payload

MemberForm.tsx:
- Fields: student_id, first_name, last_name, email, department, join_date (date picker), club_id (dropdown)
- Uses memberSchema for validation
- Pattern validation on student_id shown as helper text

BoardMemberForm.tsx:
- Fields: student_id, first_name, last_name, email, role (select dropdown with 5 options), join_date, club_id (dropdown)
- Uses boardMemberSchema for validation

VenueForm.tsx:
- Fields: name, location, capacity (number input), venue_type (optional text), description (textarea, optional)
- Uses venueSchema for validation
- Capacity must show error if <= 0

BudgetForm.tsx:
- Fields: event_id (dropdown from events API), planned_amount (number), actual_amount (number), notes (textarea, optional)
- Uses budgetSchema for validation
- Money fields must show error if negative

RegistrationForm.tsx:
- Fields: event_id (dropdown from events), member_id (dropdown from members)
- Uses registrationSchema for validation
- Simple two-field form

MessageForm.tsx:
- Fields: subject, content (textarea), club_id (dropdown), member_id (dropdown)
- Uses messageSchema for validation

SponsorshipForm.tsx:
- Fields: sponsor_name, amount (number), agreement_date (date picker), event_id (dropdown)
- Uses sponsorshipSchema for validation

3) UPDATE EXISTING FORMS
Update ClubForm.tsx, EventForm.tsx, ParticipantForm.tsx to use the new centralized Zod schemas from `src/validation/schemas.ts` instead of inline validation (if they have inline schemas, replace them; if they already import from a shared file, just ensure consistency).

4) FORM UX REQUIREMENTS
All form components must:
- Show field-level error messages below each input
- Disable submit button while submitting (loading state)
- Show toast on success and on error
- Reset form after successful submission
- Support being used inside a modal or as a standalone page section
- Use Tailwind CSS consistent with existing project styling
- Dropdown fields should fetch options from the API (clubs, events, members) using React Query

5) SHARED FORM UTILITIES
Create `src/components/forms/FormField.tsx`:
- A reusable wrapper that renders label, input, and error message
- Accepts React Hook Form register props
- Supports input types: text, email, number, date, datetime-local, textarea, select

EXPECTED RESULT:
- Centralized Zod schemas matching all backend Pydantic validation rules
- 11 form components (3 existing + 8 new) all using shared validation
- Consistent UX: field errors, loading states, toast notifications
- All dropdowns fetch real data from the API
- Forms are reusable in modals and pages
