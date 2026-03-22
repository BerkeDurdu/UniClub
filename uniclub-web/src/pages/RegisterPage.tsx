import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { saveManualClubOnboardingDraft } from "../api/services/manualClubOnboardingService";
import { getClubs } from "../api/services/clubService";
import { isAuthenticated, register as registerAccount } from "../api/services/authService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

const roleOptions = ["member", "advisor", "board_member"] as const;
const clubInputModeOptions = ["existing", "manual"] as const;

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
    role: z.enum(roleOptions),
    clubInputMode: z.enum(clubInputModeOptions).optional(),
    clubId: z.number().int().positive().optional(),
    manualClubName: z.string().optional(),
    manualClubCategory: z.string().optional(),
    manualClubDescription: z.string().optional(),
    manualClubFoundedDate: z.string().optional(),
    contactEmail: z
      .string()
      .email("Please enter a valid contact email address.")
      .optional()
      .or(z.literal("")),
    contactPhone: z.string().optional(),
    communicationChannel: z.string().optional(),
    socialLink: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((value) => {
        if (!value) {
          return true;
        }
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }, "Please enter a valid social link URL."),
    sponsorContactName: z.string().optional(),
    sponsorContactRole: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }

    const isLeadershipRole = value.role === "advisor" || value.role === "board_member";
    const mode = value.clubInputMode ?? "existing";

    if (isLeadershipRole && mode === "existing" && !value.clubId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clubId"],
        message: "Club is required for advisor and board member accounts.",
      });
    }

    if (isLeadershipRole && mode === "manual") {
      if (!value.manualClubName || value.manualClubName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manualClubName"],
          message: "Manual club name is required.",
        });
      }
      if (!value.manualClubCategory || !value.manualClubCategory.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manualClubCategory"],
          message: "Club category is required.",
        });
      }
      if (!value.manualClubDescription || !value.manualClubDescription.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manualClubDescription"],
          message: "Club description is required.",
        });
      }
      if (!value.manualClubFoundedDate || !value.manualClubFoundedDate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manualClubFoundedDate"],
          message: "Founded date is required.",
        });
      }
      if (!value.contactEmail || !value.contactEmail.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contactEmail"],
          message: "Contact email is required.",
        });
      }
    }
  });

type RegisterValues = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
      clubInputMode: "existing",
      clubId: undefined,
      manualClubName: "",
      manualClubCategory: "",
      manualClubDescription: "",
      manualClubFoundedDate: "",
      contactEmail: "",
      contactPhone: "",
      communicationChannel: "",
      socialLink: "",
      sponsorContactName: "",
      sponsorContactRole: "",
    },
  });

  const selectedRole = watch("role");
  const selectedClubInputMode = watch("clubInputMode");
  const isClubRequired = selectedRole === "advisor" || selectedRole === "board_member";
  const isManualClubMode = isClubRequired && selectedClubInputMode === "manual";

  const clubsQuery = useQuery({
    queryKey: ["register-clubs"],
    queryFn: () => getClubs({ limit: 200 }),
  });

  const registerMutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: (user, variables) => {
      toast.success("Account created successfully.");

      const shouldUseManualOnboarding =
        (variables.role === "advisor" || variables.role === "board_member") &&
        variables.clubInputMode === "manual";

      if (shouldUseManualOnboarding && typeof user.clubId === "number") {
        saveManualClubOnboardingDraft({
          club_id: user.clubId,
          club_name: variables.manualClubName?.trim() ?? "",
          category: variables.manualClubCategory?.trim() ?? "",
          description: variables.manualClubDescription?.trim() ?? "",
          founded_date: variables.manualClubFoundedDate ?? "",
          contact_email: variables.contactEmail?.trim() ?? "",
          contact_phone: variables.contactPhone?.trim() || undefined,
          communication_channel: variables.communicationChannel?.trim() || undefined,
          social_link: variables.socialLink?.trim() || undefined,
          sponsor_contact_name: variables.sponsorContactName?.trim() || undefined,
          sponsor_contact_role: variables.sponsorContactRole?.trim() || undefined,
        });
        navigate("/onboarding/club", { replace: true });
        return;
      }

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
          onSubmit={handleSubmit(
            (values) =>
              registerMutation.mutate({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                role: values.role,
                clubId: values.clubId,
                clubInputMode: values.clubInputMode,
                manualClubName: values.manualClubName,
                manualClubCategory: values.manualClubCategory,
                manualClubDescription: values.manualClubDescription,
                manualClubFoundedDate: values.manualClubFoundedDate,
                contactEmail: values.contactEmail,
                contactPhone: values.contactPhone,
                communicationChannel: values.communicationChannel,
                socialLink: values.socialLink,
                sponsorContactName: values.sponsorContactName,
                sponsorContactRole: values.sponsorContactRole,
              }),
            () => {
              toast.error("Please fix the highlighted form errors.");
            }
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
            <label className="mb-1 block text-sm font-medium text-ink">Role</label>
            <select
              className="w-full rounded-lg border border-slate/30 px-3 py-2"
              {...register("role")}
            >
              <option value="">Select a role</option>
              <option value="member">Member</option>
              <option value="advisor">Advisor</option>
              <option value="board_member">Board Member</option>
            </select>
            {errors.role ? <p className="mt-1 text-xs text-red-600">{errors.role.message}</p> : null}
          </div>

          {isClubRequired ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Club Input Mode</label>
              <select className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("clubInputMode")}>
                <option value="existing">Select existing club</option>
                <option value="manual">Enter club manually</option>
              </select>
              <p className="mt-1 text-xs text-slate">
                If your club is not listed, enter it manually and complete club profile setup.
              </p>
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Club {isClubRequired ? "*" : "(Optional)"}
            </label>

            {!isManualClubMode && !clubsQuery.isError ? (
              <select
                className="w-full rounded-lg border border-slate/30 px-3 py-2"
                {...register("clubId", {
                  setValueAs: (value) => {
                    if (value === "" || value === undefined || value === null) {
                      return undefined;
                    }
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? undefined : parsed;
                  },
                })}
                disabled={clubsQuery.isLoading}
              >
                <option value="">{isClubRequired ? "Select a club" : "No club selected"}</option>
                {(clubsQuery.data ?? []).map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            ) : !isManualClubMode ? (
              <input
                type="number"
                className="w-full rounded-lg border border-slate/30 px-3 py-2"
                placeholder={isClubRequired ? "Enter required club ID" : "Enter optional club ID"}
                {...register("clubId", {
                  setValueAs: (value) => {
                    if (value === "" || value === undefined || value === null) {
                      return undefined;
                    }
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? undefined : parsed;
                  },
                })}
              />
            ) : (
              <p className="text-xs text-slate">Manual club mode enabled. Existing club selection is not required.</p>
            )}

            {errors.clubId ? <p className="mt-1 text-xs text-red-600">{errors.clubId.message}</p> : null}
          </div>

          {isManualClubMode ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Manual Club Name *</label>
                <input className="w-full rounded-lg border border-slate/30 px-3 py-2" placeholder="HSD Istinye" {...register("manualClubName")} />
                {errors.manualClubName ? <p className="mt-1 text-xs text-red-600">{errors.manualClubName.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Club Category *</label>
                <input className="w-full rounded-lg border border-slate/30 px-3 py-2" placeholder="Academic" {...register("manualClubCategory")} />
                {errors.manualClubCategory ? <p className="mt-1 text-xs text-red-600">{errors.manualClubCategory.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Club Description *</label>
                <textarea className="w-full rounded-lg border border-slate/30 px-3 py-2" rows={3} {...register("manualClubDescription")} />
                {errors.manualClubDescription ? <p className="mt-1 text-xs text-red-600">{errors.manualClubDescription.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Founded Date *</label>
                <input type="date" className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("manualClubFoundedDate")} />
                {errors.manualClubFoundedDate ? <p className="mt-1 text-xs text-red-600">{errors.manualClubFoundedDate.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Contact Email *</label>
                <input type="email" className="w-full rounded-lg border border-slate/30 px-3 py-2" placeholder="club-contact@university.edu" {...register("contactEmail")} />
                {errors.contactEmail ? <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Contact Phone (Optional)</label>
                <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("contactPhone")} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Preferred Channel (Optional)</label>
                <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("communicationChannel")} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Social Link (Optional)</label>
                <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("socialLink")} />
                {errors.socialLink ? <p className="mt-1 text-xs text-red-600">{errors.socialLink.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Sponsor Contact Name (Optional)</label>
                <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("sponsorContactName")} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Sponsor Contact Role (Optional)</label>
                <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("sponsorContactRole")} />
              </div>
            </>
          ) : null}

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
            {errors.confirmPassword ? <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p> : null}
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
