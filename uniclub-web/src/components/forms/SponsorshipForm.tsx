import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { sponsorshipSchema, type SponsorshipFormValues } from "../../validation/schemas";
import { getEvents } from "../../api/services/eventService";
import type { SponsorshipCreatePayload } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface SponsorshipFormProps {
  onSubmit: (payload: SponsorshipCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function SponsorshipForm({ onSubmit, onCancel, isSubmitting }: SponsorshipFormProps) {
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SponsorshipFormValues>({
    resolver: zodResolver(sponsorshipSchema),
    defaultValues: {
      sponsor_name: "",
      amount: 0,
      agreement_date: "",
      event_id: events[0]?.id,
    },
  });

  const submit = async (values: SponsorshipFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <FormField
        label="Sponsor Name"
        error={errors.sponsor_name}
        registration={register("sponsor_name")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Amount"
          type="number"
          error={errors.amount}
          registration={register("amount", { valueAsNumber: true })}
        />
        <FormField
          label="Agreement Date"
          type="date"
          error={errors.agreement_date}
          registration={register("agreement_date")}
        />
      </div>

      <FormField
        label="Event"
        type="select"
        error={errors.event_id}
        registration={register("event_id", { valueAsNumber: true })}
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          Create Sponsorship
        </Button>
      </div>
    </form>
  );
}

export default SponsorshipForm;
