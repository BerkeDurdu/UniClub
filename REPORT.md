# UniClub Project Report

This report explains how the UniClub project applies all required concepts, technologies, and capabilities across backend, database, and frontend layers.

## 1. Business Problem

### 1.1 Problem Definition
University clubs often manage operations in fragmented channels (spreadsheets, messaging apps, ad hoc forms). This causes:
- Inconsistent member/event/sponsor data.
- Poor accountability for role-based actions.
- Weak visibility into registrations, participation, and budget outcomes.
- High risk of unauthorized updates to club resources.

UniClub solves this by providing a centralized club operations system with authenticated users and role-based authorization for members, advisors, and board members.

### 1.2 Stakeholders and Impact
- Club leadership (advisor/board_member): needs controlled management of own-club resources.
- Club members: needs safe participation flows without access to sensitive management features.
- Project evaluators/instructors: needs traceable evidence that architectural and technical concepts are correctly implemented.

### 1.3 Success Criteria
- Functional correctness: core modules (clubs, events, members, registrations, sponsorships, budgets, messages, reports) are operational.
- Security correctness: role-based and club-scoped constraints are enforced server-side.
- UX correctness: forbidden actions are blocked and clearly communicated on frontend.
- Integration correctness: frontend/backend contracts stay aligned after schema and policy changes.

## 2. Concepts Applied

### 2.1 Layered Architecture
- Applied through router -> service -> model separation.
- Evidence: `uniclub-api/routers/`, `uniclub-api/services.py`, `uniclub-api/models.py`.
- Benefit: business rules are centralized in services and auth dependencies, reducing duplication.

### 2.2 RESTful API Design
- Resource-oriented endpoints for CRUD and network/report views.
- Evidence: `uniclub-api/routers/*.py` (clubs, events, members, budgets, sponsorships, registrations, participants, messages, reports, auth).
- Benefit: consistent client integration and predictable route semantics.

### 2.3 Validation and Error Semantics
- Request schemas use Pydantic validations (`Field`, `EmailStr`, min length, patterns).
- Evidence: `uniclub-api/schemas.py`.
- Frontend form validation uses Zod + React Hook Form.
- Evidence: `uniclub-web/src/validation/schemas.ts`, `uniclub-web/src/pages/RegisterPage.tsx`.

### 2.4 Authentication and Authorization
- JWT authentication with login/register/me flow.
- Centralized auth dependencies (`get_current_user`, `require_roles`, club/user scope checks).
- Evidence: `uniclub-api/auth.py`, `uniclub-api/routers/auth.py`.

### 2.5 Data Integrity and Relational Modeling
- SQLModel entities with foreign keys, unique constraints, check constraints, and indexes.
- Evidence: `uniclub-api/models.py`.
- Startup compatibility migration for message schema evolution.
- Evidence: `uniclub-api/main.py` (`migrate_message_schema`).

### 2.6 Role-Based Access Control (RBAC)
- Backend policy: read and mutation permissions by role and club scope.
- Frontend policy: section/action permissions and route guards.
- Evidence: `uniclub-api/routers/*.py`, `uniclub-web/src/auth/permissions.ts`, `uniclub-web/src/components/layout/RoleSectionRoute.tsx`.

### 2.7 Client-Server Contract Alignment
- Updated message contract from member-based to sender/receiver user-based routing.
- Evidence: `uniclub-api/schemas.py`, `uniclub-api/services.py`, `uniclub-web/src/types/index.ts`, `uniclub-web/src/components/forms/MessageForm.tsx`.

### 2.8 Async State and Query Management
- React Query is used for data fetching, caching, invalidation, and mutation handling.
- Evidence: `uniclub-web/src/hooks/`.

### 2.9 UX Restriction and Feedback Design
- Restricted actions hidden or blocked pre-request, with user feedback via toast.
- Evidence: `uniclub-web/src/pages/*.tsx`, `uniclub-web/src/api/client.ts`.

## 3. Technologies Used

### 3.1 Backend Stack

#### FastAPI
- Why: typed API framework with dependency injection and automatic docs.
- How used: router registration, dependency-based auth, exception handling.
- Evidence: `uniclub-api/main.py`, `uniclub-api/routers/`.

#### SQLModel
- Why: ORM + type-hinted model definitions.
- How used: all entities and relationships.
- Evidence: `uniclub-api/models.py`.

#### PostgreSQL + psycopg
- Why: relational integrity, constraints, and transactional reliability.
- How used: primary data store for all domain and auth tables.
- Evidence: `uniclub-api/database.py`, `.env` via config.

#### Pydantic + pydantic-settings + email-validator
- Why: strict request/response typing and environment validation.
- How used: schema validation and settings loading.
- Evidence: `uniclub-api/schemas.py`, `uniclub-api/config.py`.

#### Alembic
- Why: migration discipline for evolving schema.
- How used: configured migration environment and revision workflow.
- Evidence: `uniclub-api/alembic/`, `uniclub-api/alembic.ini`.

#### passlib[bcrypt] + bcrypt
- Why: secure password hashing.
- How used: hash and verify password in auth utilities.
- Evidence: `uniclub-api/auth.py`.

#### python-jose[cryptography]
- Why: JWT creation/verification for stateless auth.
- How used: token encode/decode with HS256 and expiration claims.
- Evidence: `uniclub-api/auth.py`.

#### python-dotenv
- Why: environment variable loading in development.
- How used: `.env`-based configuration through settings.
- Evidence: `uniclub-api/config.py`.

### 3.2 Frontend Stack

#### React 19 + TypeScript + Vite
- Why: fast SPA development with strong typing and fast build/dev cycle.
- How used: all UI pages/components and strict typed service usage.
- Evidence: `uniclub-web/src/`, `uniclub-web/package.json`.

#### React Router
- Why: route-level access and structured navigation.
- How used: protected routes and section-based restricted routes.
- Evidence: `uniclub-web/src/App.tsx`, `uniclub-web/src/components/layout/ProtectedRoute.tsx`, `uniclub-web/src/components/layout/RoleSectionRoute.tsx`.

#### Axios
- Why: centralized HTTP client and interceptors.
- How used: bearer token injection and error toast strategy.
- Evidence: `uniclub-web/src/api/client.ts`.

#### TanStack React Query
- Why: robust async cache and mutation orchestration.
- How used: entity hooks for all pages.
- Evidence: `uniclub-web/src/hooks/`.

#### React Hook Form + Zod
- Why: ergonomic form state + runtime validation.
- How used: register/login/entity forms and schema-backed field errors.
- Evidence: `uniclub-web/src/components/forms/`, `uniclub-web/src/pages/RegisterPage.tsx`, `uniclub-web/src/validation/schemas.ts`.

#### Tailwind CSS + PostCSS + Autoprefixer
- Why: rapid utility styling and build-compatible CSS pipeline.
- How used: layout, typography, responsive and state styles.
- Evidence: `uniclub-web/tailwind.config.js`, `uniclub-web/postcss.config.js`, UI component classes.

#### react-hot-toast
- Why: immediate feedback for validation and permission outcomes.
- How used: success/error notifications across pages and API errors.
- Evidence: page-level handlers and `uniclub-web/src/api/client.ts`.

#### lucide-react
- Why: clean icon system for navigation and UI affordances.
- How used: layout/navigation icons.
- Evidence: `uniclub-web/src/components/layout/AppLayout.tsx`.

## 4. Capabilities Demonstrated

### 4.1 Auth Flow End-to-End
- Register, login, JWT storage, session restore, and `/auth/me` context usage.
- Evidence: `uniclub-api/routers/auth.py`, `uniclub-web/src/api/services/authService.ts`.

### 4.2 Role Permissions and Route Guarding
- Member restrictions and staff-only sections implemented both server and client side.
- Evidence: `uniclub-api/auth.py`, `uniclub-web/src/auth/permissions.ts`, `uniclub-web/src/components/layout/RoleSectionRoute.tsx`.

### 4.3 Club-Scoped Management Rules
- Staff can mutate own-club resources; cross-club mutation is blocked.
- Evidence: budget/event/sponsorship/registration/participant/advisor/board routers in `uniclub-api/routers/`.

### 4.4 Messaging Policy Controls
- Sender/receiver constraints by role, same-club checks, and no self-message rule.
- Recipient options endpoint integrated into frontend form.
- Evidence: `uniclub-api/services.py`, `uniclub-api/routers/messages.py`, `uniclub-web/src/components/forms/MessageForm.tsx`.

### 4.5 Financial Visibility Restrictions
- Member cannot view budget amounts and sponsorship amounts.
- Foreign-club rows show restricted masking where applicable.
- Evidence: `uniclub-web/src/pages/EventDetailPage.tsx`, `uniclub-web/src/pages/BudgetsPage.tsx`, `uniclub-web/src/pages/SponsorshipsPage.tsx`.

### 4.6 Report and Network Views
- Club/event/member network endpoints aggregate relationship data for detail pages.
- Evidence: `uniclub-api/routers/reports.py`, `uniclub-api/services.py` report methods.

### 4.7 Error and Edge-Case Handling
- Consistent error handling in API client and backend exception path.
- Startup seed race hardening and message schema compatibility migration.
- Evidence: `uniclub-web/src/api/client.ts`, `uniclub-api/main.py`.

### 4.8 Build and Runtime Readiness
- Frontend build command and successful build flow used during validation.
- Backend health endpoints and docs endpoints available.
- Evidence: `uniclub-web/package.json` scripts, `uniclub-api/main.py` health routes.

## 5. Data Model and Database Evidence

### 5.1 Core Entities
- Club, Advisor, Member, BoardMember, Venue, Event, Budget, Registration, Participant, Sponsorship, Message, User.
- Evidence: `uniclub-api/models.py`.

### 5.2 Key Relationship Patterns
- Club-to-many (members/events/messages/board members).
- Event-to-one venue; Event-to-many registrations/participants/sponsorships.
- User-to-role profile via `user_id` links.
- Message sender/receiver mapped to `app_user` ids.

### 5.3 Integrity Controls
- Unique constraints (for example user email).
- Check constraints for non-empty/full-name and role/club validity conditions.
- Foreign keys and partial uniqueness where appropriate.

### 5.4 Database Evidence Assets
- Relationship verification notes: `uniclub-api/database_relationship_proof.md`.
- README diagnostics SQL checks for `app_user` integrity: `uniclub-api/README.md`.

## 6. API Evidence

### 6.1 Authentication
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### 6.2 Core Domain Endpoints
- Clubs: list/detail/create/update/delete policies.
- Events: list/detail/create/update/delete with own-club mutation checks.
- Members/Advisors/Board members: read + role-scoped mutations.
- Budgets/Sponsorships/Registrations/Participants: scoped mutation workflows.
- Messages: create/list/list-by-club/recipient-options with routing policy checks.
- Reports: club network, event network, member network.

### 6.3 Authorization Behavior
- Public read routes exist for selected resources.
- Most reads require auth for protected modules.
- Mutations are role-and-club scoped via dependencies and service checks.

## 7. Frontend Evidence

### 7.1 Main Flows
- Auth and onboarding: register/login/manual club onboarding.
- Operations dashboards: clubs, events, budgets, sponsorships, registrations, messages.
- Relationship detail: club and event detail pages powered by report endpoints.

### 7.2 Role-Specific UI Behavior
- Member: read-focused access, restricted management routes/actions.
- Advisor/board_member: management actions available only within own-club scope.

### 7.3 Client-Side Safety
- Permission checks short-circuit forbidden mutations before API request.
- Route-level guards redirect restricted access attempts.

## 8. Testing and Validation

### 8.1 Scenario Coverage
- Frontend scenario document includes prompt-based test suites for auth, permissions, onboarding, and scoped actions.
- Evidence: `uniclub-web/test_scenarios_frontend.md`.

### 8.2 Validation Types Performed
- Manual flow verification for register/login/authenticated navigation.
- Permission blocking checks for member and cross-club mutations.
- Build validation through `npm run build`.

### 8.3 Current Limitations
- Some modules still rely on local profile persistence until backend schema expansion.
- Not all entities have full update/delete UI coverage.

## 9. Challenges and Resolutions

### 9.1 Messaging Recipient Mismatch
- Problem: member messaging could fail due to missing linked app users.
- Resolution: startup backfill and recipient options flow bound to `app_user`.

### 9.2 Startup Seed Duplicate Email Risk
- Problem: reload cycles could trigger duplicate insert race conditions.
- Resolution: integrity-error-safe seed behavior with rollback and refetch.

### 9.3 Budget Visibility and 404 Noise
- Problem: financial leakage risk across clubs and noisy missing-budget calls.
- Resolution: restricted rendering for foreign-club financial fields and optional budget fetch handling.

### 9.4 Auth and Scope Regression Risk
- Problem: frontend/backend policy drift.
- Resolution: centralized permission helpers and backend dependency guards.

## 10. Conclusion

UniClub delivers a technically integrated university club management platform with:
- Strong backend authority for security-sensitive operations.
- Clear frontend UX for role-based capabilities and restrictions.
- Relational data integrity and evolvable schema strategy.
- Practical, demonstrable implementation of covered backend, database, and frontend concepts.

From a business-problem perspective, the solution directly addresses fragmented club operations by unifying governance, participation tracking, and reporting in a role-aware workflow.

## 11. References

- Backend root: `uniclub-api/`
- Frontend root: `uniclub-web/`
- Backend docs: `uniclub-api/README.md`
- Frontend docs: `uniclub-web/README.md`
- Backend notes: `uniclub-api/backend_design_notes.md`
- Database proof: `uniclub-api/database_relationship_proof.md`
- Backend test scenarios: `uniclub-api/test_scenarios.md`
- Frontend test scenarios: `uniclub-web/test_scenarios_frontend.md`
- Prompt history artifacts:
	- `backend prompts/`
	- `database prompts/`
	- `frontend prompts/`
	- `api integration & validation prompts/`
