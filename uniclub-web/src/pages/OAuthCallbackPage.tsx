import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { finalizeTokenLogin } from "../api/services/authService";
import Card from "../components/common/Card";

function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      toast.error("Missing OAuth token.");
      navigate("/auth/login", { replace: true });
      return;
    }
    finalizeTokenLogin(token)
      .then(() => {
        toast.success("Signed in.");
        navigate("/dashboard", { replace: true });
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "OAuth login failed.");
        navigate("/auth/login", { replace: true });
      });
  }, [navigate]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <Card className="w-full text-center">
        <p className="text-slate">Finishing sign-in...</p>
      </Card>
    </main>
  );
}

export default OAuthCallbackPage;
