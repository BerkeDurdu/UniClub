import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Button from "../common/Button";
import type { ClubCreatePayload, ClubLocalProfile } from "../../types";
import { clubSchema } from "../../validation/schemas";

const clubFormSchema = clubSchema.extend({
  contact_email: z.string().email("Valid contact email is required"),
  contact_phone: z.string().optional(),
  communication_channel: z.string().optional(),
  social_link: z
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
    }, "Social link must be a valid URL"),
  sponsor_contact_name: z.string().optional(),
  sponsor_contact_role: z.string().optional(),
});

type ClubFormValues = z.infer<typeof clubFormSchema>;

export interface ClubFormSubmitPayload {
  createPayload: ClubCreatePayload;
  localProfile: ClubLocalProfile;
}

interface ClubFormProps {
  onSubmit: (payload: ClubFormSubmitPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ClubForm({ onSubmit, onCancel, isSubmitting }: ClubFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClubFormValues>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Academic",
      founded_date: "",
      contact_email: "",
      contact_phone: "",
      communication_channel: "",
      social_link: "",
      sponsor_contact_name: "",
      sponsor_contact_role: "",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          createPayload: {
            name: values.name,
            description: values.description,
            category: values.category,
            founded_date: values.founded_date,
          },
          localProfile: {
            contact_email: values.contact_email,
            contact_phone: values.contact_phone || undefined,
            communication_channel: values.communication_channel || undefined,
            social_link: values.social_link || undefined,
            sponsor_contact_name: values.sponsor_contact_name || undefined,
            sponsor_contact_role: values.sponsor_contact_role || undefined,
          },
        });
      })}
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Name</label>
        <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Description</label>
        <textarea className="w-full rounded-lg border border-slate/30 px-3 py-2" rows={3} {...register("description")} />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Category</label>
          <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("category")} />
          {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Founded Date</label>
          <input type="date" className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("founded_date")} />
          {errors.founded_date && <p className="mt-1 text-xs text-red-600">{errors.founded_date.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Contact Email</label>
          <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("contact_email")} />
          {errors.contact_email && <p className="mt-1 text-xs text-red-600">{errors.contact_email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Contact Phone (optional)</label>
          <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("contact_phone")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Preferred Channel (optional)</label>
          <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("communication_channel")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Social Link (optional)</label>
          <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("social_link")} />
          {errors.social_link && <p className="mt-1 text-xs text-red-600">{errors.social_link.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Sponsor Contact Name (optional)</label>
          <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("sponsor_contact_name")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Sponsor Contact Role (optional)</label>
          <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("sponsor_contact_role")} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          Create Club
        </Button>
      </div>
    </form>
  );
}

export default ClubForm;
