Perform a final consistency pass on the `UniClub Web` frontend. Do not rebuild anything.

IMPORTANT:
- Only fix inconsistencies, missing imports, broken references, or integration gaps with the backend.
- Ensure the frontend matches the grading rubric for technical documentation.

CHECK AND FIX THE FOLLOWING:
1. Ensure all 11 entities (Club, Advisor, Member, BoardMember, Event, Message, Registration, Sponsorship, Venue, Budget, Participant) are visible somewhere in the UI (either as their own pages or nested inside detail pages).
2. Ensure no TypeScript `any` types are used where proper interfaces exist.
3. Verify that environment variables are correctly documented.
4. Ensure Tailwind classes are not conflicting.

README & REPOSITORY PREPARATION:
Update `README.md` to include:
- A comprehensive overview of the tech stack (React, Vite, TS, Tailwind, React Query, Zod).
- Clear instructions on how to start the frontend AND backend together.
- A "Features" section highlighting: Client-side routing, optimistic UI updates, form validation, and global error handling.

SCREENSHOTS DIRECTORY:
- Create a `screenshots/` directory in the root.
- Add placeholder `screenshot-1.png`, `screenshot-2.png`, etc.
- In `README.md`, add a visual section embedding these screenshots using markdown (`![Dashboard](./screenshots/screenshot-1.png)`). Provide instructions in the README on how the developer should replace these placeholders with actual screenshots of the running app.

EXPECTED RESULT:
- The frontend builds without warnings or TS errors.
- The UI perfectly complements the FastAPI backend.
- The repository is fully documented, screenshot-ready, and optimized for maximum grading points.