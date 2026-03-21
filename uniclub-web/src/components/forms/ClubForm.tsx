import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Button from "../common/Button";
import type { ClubCreatePayload } from "../../types";

const clubSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  founded_date: z.string().min(1, "Founded date is required"),
});

type ClubFormValues = z.infer<typeof clubSchema>;

interface ClubFormProps {
  onSubmit: (payload: ClubCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ClubForm({ onSubmit, onCancel, isSubmitting }: ClubFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClubFormValues>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Academic",
      founded_date: "",
    },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
