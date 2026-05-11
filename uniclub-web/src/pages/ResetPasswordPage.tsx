import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { resetPassword } from "../api/services/authService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string().min(8, "Please confirm your password."),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => resetPassword(token, values.password),
    onSuccess: () => {
      toast.success("Password updated. Please sign in.");
      navigate("/auth/login", { replace: true });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Reset failed."),
  });

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <Card className="w-full">
          <h1 className="headline text-3xl font-bold text-ink">Reset password</h1>
          <p className="mt-2 text-sm text-red-600">
            This reset link is missing its token. Request a new link below.
          </p>
          <Link
            to="/auth/forgot-password"
            className="mt-4 inline-block text-sm font-semibold text-ink underline"
          >
            Request a new reset link
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="headline text-3xl font-bold text-ink">Reset password</h1>
        <p className="mt-2 text-sm text-slate">
          Pick a new password for your UniClub account.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">New password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate/30 px-3 py-2"
              placeholder="Minimum 8 characters"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Confirm password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate/30 px-3 py-2"
              placeholder="Repeat the new password"
              {...register("confirm")}
            />
            {errors.confirm ? (
              <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" isLoading={mutation.isPending}>
            Update password
          </Button>

          <p className="text-sm text-slate">
            Link expired?{" "}
            <Link to="/auth/forgot-password" className="font-semibold text-ink underline">
              Request a new one
            </Link>
          </p>
        </form>
      </Card>
    </main>
  );
}

export default ResetPasswordPage;
