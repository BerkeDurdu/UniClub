import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { memberSchema, type MemberFormValues } from "../../validation/schemas";
import { getClubs } from "../../api/services/clubService";
import type { MemberCreatePayload } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface MemberFormProps {
  onSubmit: (payload: MemberCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function MemberForm({ onSubmit, onCancel, isSubmitting }: MemberFormProps) {
  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => getClubs(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      student_id: "",
      first_name: "",
      last_name: "",
      email: "",
      department: "",
      join_date: "",
    },
  });

  const submit = async (values: MemberFormValues) => {
    await onSubmit({
      student_id: values.student_id,
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      department: values.department,
      join_date: values.join_date,
      club_id: values.club_id,
    });
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <FormField
        label="Student ID"
        error={errors.student_id}
        registration={register("student_id")}
        helperText="Alphanumeric characters only"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="First Name"
          error={errors.first_name}
          registration={register("first_name")}
        />
        <FormField
          label="Last Name"
          error={errors.last_name}
          registration={register("last_name")}
        />
      </div>

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
          label="Join Date"
          type="date"
          error={errors.join_date}
          registration={register("join_date")}
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
          Create Member
        </Button>
      </div>
    </form>
  );
}

export default MemberForm;
