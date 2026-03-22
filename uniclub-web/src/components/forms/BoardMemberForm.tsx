import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { boardMemberSchema, type BoardMemberFormValues } from "../../validation/schemas";
import { getClubs } from "../../api/services/clubService";
import type { BoardMemberCreatePayload, BoardRole, Club } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface BoardMemberFormProps {
  onSubmit: (payload: BoardMemberCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  clubs?: Club[];
}

const roleOptions: BoardRole[] = [
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Coordinator",
];

function BoardMemberForm({ onSubmit, onCancel, isSubmitting, clubs: providedClubs }: BoardMemberFormProps) {
  const { data: queriedClubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => getClubs(),
    enabled: !providedClubs,
  });
  const clubs = providedClubs ?? queriedClubs;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardMemberFormValues>({
    resolver: zodResolver(boardMemberSchema),
    defaultValues: {
      student_id: "",
      first_name: "",
      last_name: "",
      email: "",
      role: "President",
      join_date: "",
      club_id: clubs[0]?.id,
    },
  });

  const submit = async (values: BoardMemberFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <FormField
        label="Student ID"
        error={errors.student_id}
        registration={register("student_id")}
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
          label="Role"
          type="select"
          error={errors.role}
          registration={register("role")}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </FormField>

        <FormField
          label="Join Date"
          type="date"
          error={errors.join_date}
          registration={register("join_date")}
        />
      </div>

      <FormField
        label="Club"
        type="select"
        error={errors.club_id}
        registration={register("club_id", { valueAsNumber: true })}
      >
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
          Create Board Member
        </Button>
      </div>
    </form>
  );
}

export default BoardMemberForm;
