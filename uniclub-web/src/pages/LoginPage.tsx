import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Github, Mail, Cloud, Facebook } from "lucide-react";
import { isAuthenticated, login, finalizeTokenLogin } from "../api/services/authService";
import { listProviders, loginUrl, type OAuthProvider } from "../api/services/oauthService";
import {
  loginVerifyTotp,
  loginEmailSend,
  loginVerifyEmail,
  webauthnLoginStart,
  webauthnLoginVerify,
} from "../api/services/twoFactorService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

interface RouteState {
  from?: string;
}

type ChallengeMethod = "totp" | "email" | "webauthn";

const PROVIDER_LABELS: Record<OAuthProvider, { label: string; icon: ReactNode }> = {
  google: { label: "Google", icon: <Mail className="h-4 w-4" /> },
  github: { label: "GitHub", icon: <Github className="h-4 w-4" /> },
  microsoft: { label: "Microsoft", icon: <Cloud className="h-4 w-4" /> },
  facebook: { label: "Facebook", icon: <Facebook className="h-4 w-4" /> },
};

function b64urlToArrayBuffer(b64: string): ArrayBuffer {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const std = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(std);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function arrayBufferToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as RouteState | null)?.from ?? "/dashboard";

  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [methods, setMethods] = useState<ChallengeMethod[]>([]);
  const [activeMethod, setActiveMethod] = useState<ChallengeMethod>("totp");
  const [code, setCode] = useState("");

  const { data: providers = [] } = useQuery({
    queryKey: ["oauth-providers"],
    queryFn: listProviders,
    staleTime: 60_000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      if (result.kind === "ok") {
        toast.success("Login successful.");
        navigate(from, { replace: true });
      } else {
        setChallengeToken(result.challengeToken);
        setMethods(result.methods);
        setActiveMethod(result.methods[0] ?? "totp");
        toast("Two-factor authentication required.");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    },
  });

  async function finalize(token: string) {
    await finalizeTokenLogin(token);
    toast.success("Login successful.");
    navigate(from, { replace: true });
  }

  const totpMutation = useMutation({
    mutationFn: () => loginVerifyTotp(challengeToken!, code.trim()),
    onSuccess: finalize,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Invalid code."),
  });

  const emailSendMutation = useMutation({
    mutationFn: () => loginEmailSend(challengeToken!),
    onSuccess: () => toast.success("Code sent. Check your email or server logs."),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send code."),
  });

  const emailVerifyMutation = useMutation({
    mutationFn: () => loginVerifyEmail(challengeToken!, code.trim()),
    onSuccess: finalize,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Invalid code."),
  });

  const webAuthnMutation = useMutation({
    mutationFn: async () => {
      const opts = await webauthnLoginStart(challengeToken!);
      const allowCredentials = opts.allowCredentials.map((c) => ({
        ...c,
        id: b64urlToArrayBuffer(c.id),
      }));
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: b64urlToArrayBuffer(opts.challenge),
          rpId: opts.rpId,
          allowCredentials: allowCredentials as PublicKeyCredentialDescriptor[],
          timeout: opts.timeout,
          userVerification: opts.userVerification as UserVerificationRequirement,
        },
      })) as PublicKeyCredential | null;
      if (!assertion) throw new Error("WebAuthn cancelled");
      return webauthnLoginVerify(challengeToken!, opts.challenge, arrayBufferToB64url(assertion.rawId));
    },
    onSuccess: finalize,
    onError: (e) => toast.error(e instanceof Error ? e.message : "WebAuthn failed."),
  });

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="headline text-3xl font-bold text-ink">Login</h1>
        <p className="mt-2 text-sm text-slate">Sign in to access the UniClub dashboard.</p>

        {!challengeToken ? (
          <>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate/30 px-3 py-2"
                  placeholder="name@university.edu"
                  {...register("email")}
                />
                {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate/30 px-3 py-2"
                  placeholder="Minimum 8 characters"
                  {...register("password")}
                />
                {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
              </div>

              <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
                Login
              </Button>
            </form>

            {providers.length > 0 ? (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate/20" />
                  <span className="text-xs uppercase tracking-wide text-slate">Or continue with</span>
                  <span className="h-px flex-1 bg-slate/20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {providers.map((p) => (
                    <a
                      key={p}
                      href={loginUrl(p)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate/30 px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate/10"
                    >
                      {PROVIDER_LABELS[p].icon}
                      {PROVIDER_LABELS[p].label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="mt-4 text-sm text-slate">
              No account yet? <Link to="/auth/register" className="font-semibold text-ink underline">Create one</Link>
            </p>
            <p className="mt-1 text-sm text-slate">
              <Link to="/auth/forgot-password" className="font-semibold text-ink underline">Forgot password?</Link>
            </p>
          </>
        ) : (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">Two-factor authentication</h2>
            <div className="flex gap-2">
              {methods.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => { setActiveMethod(m); setCode(""); }}
                  className={`rounded-lg px-3 py-1 text-sm ${activeMethod === m ? "bg-ink text-white" : "border border-slate/30 text-ink"}`}
                >
                  {m === "totp" ? "Authenticator" : m === "email" ? "Email code" : "Security key"}
                </button>
              ))}
            </div>

            {activeMethod === "totp" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">6-digit code</label>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full rounded-lg border border-slate/30 px-3 py-2 tracking-widest"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Button className="mt-3 w-full" isLoading={totpMutation.isPending} onClick={() => totpMutation.mutate()}>
                  Verify
                </Button>
              </div>
            ) : null}

            {activeMethod === "email" ? (
              <div>
                <Button className="w-full" isLoading={emailSendMutation.isPending} onClick={() => emailSendMutation.mutate()}>
                  Send code to email
                </Button>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  className="mt-3 w-full rounded-lg border border-slate/30 px-3 py-2 tracking-widest"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Button className="mt-3 w-full" isLoading={emailVerifyMutation.isPending} onClick={() => emailVerifyMutation.mutate()}>
                  Verify code
                </Button>
              </div>
            ) : null}

            {activeMethod === "webauthn" ? (
              <Button className="w-full" isLoading={webAuthnMutation.isPending} onClick={() => webAuthnMutation.mutate()}>
                Use security key / passkey
              </Button>
            ) : null}

            <button
              type="button"
              onClick={() => { setChallengeToken(null); setMethods([]); setCode(""); }}
              className="mt-2 text-sm text-slate underline"
            >
              Cancel
            </button>
          </div>
        )}
      </Card>
    </main>
  );
}

export default LoginPage;
