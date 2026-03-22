import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ParticipantCreatePayload } from "../../types";
import Button from "../common/Button";
import { participantSchema } from "../../validation/schemas";

const participantInlineSchema = participantSchema.pick({
  first_name: true,
  last_name: true,
  email: true,
});

type ParticipantValues = { first_name: string; last_name: string; email?: string | undefined };

interface ParticipantFormProps {
  eventId: number;
  onSubmit: (payload: ParticipantCreatePayload) => Promise<void>;
  isSubmitting: boolean;
}

function ParticipantForm({ eventId, onSubmit, isSubmitting }: ParticipantFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParticipantValues>({
    resolver: zodResolver(participantInlineSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  const submit = async (values: ParticipantValues) => {
    await onSubmit({
      event_id: eventId,
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email || undefined,
    });
    reset();
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input
            className="w-full rounded-lg border border-slate/30 px-3 py-2"
            placeholder="First name"
            {...register("first_name")}
          />
          {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>}
        </div>
        <div>
          <input
            className="w-full rounded-lg border border-slate/30 px-3 py-2"
            placeholder="Last name"
            {...register("last_name")}
          />
          {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>}
        </div>
      </div>

      <div>
        <input
          className="w-full rounded-lg border border-slate/30 px-3 py-2"
          placeholder="Email (optional)"
          {...register("email")}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <Button type="submit" variant="ghost" isLoading={isSubmitting}>
        Add External Participant
      </Button>
    </form>
  );
}

export default ParticipantForm;
