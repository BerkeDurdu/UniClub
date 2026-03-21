Create a complete frontend-only React project called "UniClub Web" for a university club and event management system.

IMPORTANT:
- This is frontend-only. Do not create any backend code.
- Use React with Vite and TypeScript.
- Use Tailwind CSS for styling.
- Use React Router DOM for routing.
- The project must be runnable from zero, including setup files.
- Generate real working code, not pseudo-code.
- Keep the implementation professional, extensible, and safe to build on in later prompts.

GOAL:
Generate the initial frontend project so that after setup:
- the Vite development server runs successfully
- Tailwind CSS is configured and working
- basic routing is in place with a persistent navigation bar
- the app connects to a local FastAPI backend running on `http://127.0.0.1:8000`

PROJECT STRUCTURE:
Create a folder called `uniclub-web` with at least these configurations:
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tailwind.config.js`
- `postcss.config.js`
- `.env.example`
- `.gitignore`
- `README.md`

DEPENDENCIES:
Include these in `package.json`:
- react, react-dom
- react-router-dom
- axios
- tailwindcss, postcss, autoprefixer
- lucide-react (for icons)

ENVIRONMENT SETUP:
Create `.env.example` with:
- `VITE_API_BASE_URL=http://127.0.0.1:8000`

APP LAYOUT:
Create a main layout with:
- A top navigation bar with links to: Dashboard, Clubs, Events, Members
- A responsive container for page content
- A simple footer

INITIAL PAGES (Basic UI with mock or empty states):
- `Dashboard`: Welcome message and quick stats placeholders
- `ClubsPage`: A grid layout ready to display clubs
- `EventsPage`: A list layout ready to display events
- `NotFoundPage`: A clean 404 error page

API CLIENT:
Create `src/api/client.ts`:
- Configure an Axios instance using `VITE_API_BASE_URL`
- Add a basic response interceptor to log errors to the console

README REQUIREMENTS:
In `README.md`, include a beginner-friendly setup guide with:
1. How to create the project folder
2. How to install dependencies (`npm install`)
3. How to copy `.env.example` to `.env`
4. How to run the app (`npm run dev`)
5. Note that the FastAPI backend must be running simultaneously

EXPECTED RESULT:
- A working Vite + React + TS project
- Tailwind CSS styling applied to a clean layout
- Working client-side routing
- Ready for API integration in the next phase