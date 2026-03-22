import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { budgetSchema, type BudgetFormValues } from "../../validation/schemas";
import { getEvents } from "../../api/services/eventService";
import type { BudgetCreatePayload, Event } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface BudgetFormProps {
  onSubmit: (payload: BudgetCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  events?: Event[];
}

function BudgetForm({ onSubmit, onCancel, isSubmitting, events: providedEvents }: BudgetFormProps) {
  const { data: queriedEvents = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
    enabled: !providedEvents,
  });
  const events = providedEvents ?? queriedEvents;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      event_id: events[0]?.id,
      planned_amount: 0,
      actual_amount: 0,
      notes: "",
    },
  });

  const submit = async (values: BudgetFormValues) => {
    await onSubmit({
      event_id: values.event_id,
      planned_amount: values.planned_amount,
      actual_amount: values.actual_amount,
      notes: values.notes || undefined,
    });
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Planned Amount"
          type="number"
          error={errors.planned_amount}
          registration={register("planned_amount", { valueAsNumber: true })}
        />
        <FormField
          label="Actual Amount"
          type="number"
          error={errors.actual_amount}
          registration={register("actual_amount", { valueAsNumber: true })}
        />
      </div>

      <FormField
        label="Notes (optional)"
        type="textarea"
        error={errors.notes}
        registration={register("notes")}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          Create Budget
        </Button>
      </div>
    </form>
  );
}

export default BudgetForm;
