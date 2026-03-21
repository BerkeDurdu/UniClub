import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { isAuthenticated, register as registerAccount } from "../api/services/authService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

type RegisterValues = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: () => {
      toast.success("Account created successfully.");
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Registration failed.";
      toast.error(message);
    },
  });

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="headline text-3xl font-bold text-ink">Create Account</h1>
        <p className="mt-2 text-sm text-slate">Register to start managing clubs and events.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit((values) =>
            registerMutation.mutate({
              fullName: values.fullName,
              email: values.email,
              password: values.password,
            })
          )}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Full Name</label>
            <input
              className="w-full rounded-lg border border-slate/30 px-3 py-2"
              placeholder="Alex Johnson"
              {...register("fullName")}
            />
            {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p> : null}
          </div>

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

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Confirm Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate/30 px-3 py-2"
              placeholder="Repeat password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
            Register
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate">
          Already have an account? <Link to="/auth/login" className="font-semibold text-ink underline">Login</Link>
        </p>
      </Card>
    </main>
  );
}

export default RegisterPage;
