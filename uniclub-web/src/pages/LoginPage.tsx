import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { isAuthenticated, login } from "../api/services/authService";
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

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as RouteState | null)?.from ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      toast.success("Login successful.");
      navigate(from, { replace: true });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Login failed.";
      toast.error(message);
    },
  });

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="headline text-3xl font-bold text-ink">Login</h1>
        <p className="mt-2 text-sm text-slate">Sign in to access the UniClub dashboard.</p>

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

        <p className="mt-4 text-sm text-slate">
          No account yet? <Link to="/auth/register" className="font-semibold text-ink underline">Create one</Link>
        </p>
      </Card>
    </main>
  );
}

export default LoginPage;
