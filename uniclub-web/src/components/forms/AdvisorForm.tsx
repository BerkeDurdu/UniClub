import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { advisorSchema, type AdvisorFormValues } from "../../validation/schemas";
import { getClubs } from "../../api/services/clubService";
import type { AdvisorCreatePayload } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface AdvisorFormProps {
  onSubmit: (payload: AdvisorCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function AdvisorForm({ onSubmit, onCancel, isSubmitting }: AdvisorFormProps) {
  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => getClubs(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdvisorFormValues>({
    resolver: zodResolver(advisorSchema),
    defaultValues: {
      full_name: "",
      email: "",
      department: "",
      assigned_date: "",
    },
  });

  const submit = async (values: AdvisorFormValues) => {
    await onSubmit({
      full_name: values.full_name,
      email: values.email,
      department: values.department,
      assigned_date: values.assigned_date,
      club_id: values.club_id,
    });
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <FormField
        label="Full Name"
        error={errors.full_name}
        registration={register("full_name")}
      />

      <FormField
        label="Email"
        type="email"
        error={errors.email}
        registration={register("email")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Department"
          error={errors.department}
          registration={register("department")}
        />
        <FormField
          label="Assigned Date"
          type="date"
          error={errors.assigned_date}
          registration={register("assigned_date")}
        />
      </div>

      <FormField
        label="Club (optional)"
        type="select"
        error={errors.club_id}
        registration={register("club_id", {
          setValueAs: (v) => (v === "" ? undefined : Number(v)),
        })}
      >
        <option value="">No club</option>
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          Create Advisor
        </Button>
      </div>
    </form>
  );
}

export default AdvisorForm;
