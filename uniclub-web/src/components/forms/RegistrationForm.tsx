import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { registrationSchema, type RegistrationFormValues } from "../../validation/schemas";
import { getEvents } from "../../api/services/eventService";
import { getMembers } from "../../api/services/memberService";
import type { Event, Member, RegistrationCreatePayload } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface RegistrationFormProps {
  onSubmit: (payload: RegistrationCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  events?: Event[];
  members?: Member[];
}

function RegistrationForm({ onSubmit, onCancel, isSubmitting, events: providedEvents, members: providedMembers }: RegistrationFormProps) {
  const { data: queriedEvents = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
    enabled: !providedEvents,
  });

  const { data: queriedMembers = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => getMembers(),
    enabled: !providedMembers,
  });
  const events = providedEvents ?? queriedEvents;
  const members = providedMembers ?? queriedMembers;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      event_id: events[0]?.id,
      member_id: members[0]?.id,
    },
  });

  const submit = async (values: RegistrationFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
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

      <FormField
        label="Member"
        type="select"
        error={errors.member_id}
        registration={register("member_id", { valueAsNumber: true })}
      >
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.first_name} {member.last_name}
          </option>
        ))}
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          Create Registration
        </Button>
      </div>
    </form>
  );
}

export default RegistrationForm;
