import { Link } from "react-router-dom";
import Button from "../components/common/Button";

function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="headline text-6xl font-bold text-signal">404</p>
      <h1 className="headline mt-3 text-3xl font-semibold text-ink">Sayfa bulunamadi</h1>
      <p className="mt-2 text-slate">Istedigin rota UniClub Web icinde mevcut degil.</p>
      <Link className="mt-6" to="/dashboard">
        <Button>Dashboard'a Don</Button>
      </Link>
    </main>
  );
}

export default NotFoundPage;
