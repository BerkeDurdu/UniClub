import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { forgotPassword } from "../api/services/authService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type FormValues = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => forgotPassword(values.email),
    onSettled: () => setSubmitted(true),
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="headline text-3xl font-bold text-ink">Forgot password</h1>
        <p className="mt-2 text-sm text-slate">
          Enter the email tied to your UniClub account and we'll send a reset link.
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg bg-slate/10 p-3 text-sm text-ink">
              If an account exists for this email, a reset link has been sent. The link is
              valid for 1 hour.
            </p>
            <Link to="/auth/login" className="text-sm font-semibold text-ink underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate/30 px-3 py-2"
                placeholder="name@university.edu"
                {...register("email")}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Send reset link
            </Button>

            <p className="text-sm text-slate">
              Remembered it?{" "}
              <Link to="/auth/login" className="font-semibold text-ink underline">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </Card>
    </main>
  );
}

export default ForgotPasswordPage;
