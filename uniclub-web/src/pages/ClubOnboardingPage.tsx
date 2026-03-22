import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  clearManualClubOnboardingDraft,
  getManualClubOnboardingDraft,
} from "../api/services/manualClubOnboardingService";
import { isAuthenticated } from "../api/services/authService";
import { upsertClubLocalProfile } from "../api/services/clubProfileService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

const onboardingSchema = z
  .object({
    category: z.string().min(1, "Category is required."),
    description: z.string().min(1, "Description is required."),
    foundedDate: z.string().min(1, "Founded date is required."),
    contactEmail: z.string().email("Please enter a valid contact email address."),
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
  });

type OnboardingValues = z.infer<typeof onboardingSchema>;

function ClubOnboardingPage() {
  const navigate = useNavigate();
  const draft = getManualClubOnboardingDraft();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      category: draft?.category ?? "",
      description: draft?.description ?? "",
      foundedDate: draft?.founded_date ?? "",
      contactEmail: draft?.contact_email ?? "",
      contactPhone: draft?.contact_phone ?? "",
      communicationChannel: draft?.communication_channel ?? "",
      socialLink: draft?.social_link ?? "",
      sponsorContactName: draft?.sponsor_contact_name ?? "",
      sponsorContactRole: draft?.sponsor_contact_role ?? "",
    },
  });

  useEffect(() => {
    if (!draft) {
      toast("No pending club onboarding draft found.");
      navigate("/dashboard", { replace: true });
    }
  }, [draft, navigate]);

  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!draft) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-10">
      <Card className="w-full">
        <h1 className="headline text-3xl font-bold text-ink">Complete Club Onboarding</h1>
        <p className="mt-2 text-sm text-slate">
          Finish your club profile for {draft.club_name} before continuing.
        </p>

        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            upsertClubLocalProfile(draft.club_id, {
              category: values.category,
              description: values.description,
              founded_date: values.foundedDate,
              contact_email: values.contactEmail,
              contact_phone: values.contactPhone || undefined,
              communication_channel: values.communicationChannel || undefined,
              social_link: values.socialLink || undefined,
              sponsor_contact_name: values.sponsorContactName || undefined,
              sponsor_contact_role: values.sponsorContactRole || undefined,
            });
            clearManualClubOnboardingDraft();
            toast.success("Club onboarding completed.");
            navigate("/dashboard", { replace: true });
          })}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Club Name</label>
            <input className="w-full rounded-lg border border-slate/30 px-3 py-2 bg-slate-50" value={draft.club_name} disabled />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Category *</label>
            <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("category")} />
            {errors.category ? <p className="mt-1 text-xs text-red-600">{errors.category.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Description *</label>
            <textarea className="w-full rounded-lg border border-slate/30 px-3 py-2" rows={3} {...register("description")} />
            {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Founded Date *</label>
            <input type="date" className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("foundedDate")} />
            {errors.foundedDate ? <p className="mt-1 text-xs text-red-600">{errors.foundedDate.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Contact Email *</label>
            <input type="email" className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("contactEmail")} />
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

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Complete Onboarding
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default ClubOnboardingPage;
