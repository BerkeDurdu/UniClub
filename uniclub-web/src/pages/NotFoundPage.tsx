import { Link } from "react-router-dom";
import Button from "../components/common/Button";

function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="headline text-6xl font-bold text-signal">404</p>
      <h1 className="headline mt-3 text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-slate">The route you requested does not exist in UniClub Web.</p>
      <Link className="mt-6" to="/dashboard">
        <Button>Back to Dashboard</Button>
      </Link>
    </main>
  );
}

export default NotFoundPage;
