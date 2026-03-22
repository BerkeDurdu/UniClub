import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { venueSchema, type VenueFormValues } from "../../validation/schemas";
import type { VenueCreatePayload } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface VenueFormProps {
  onSubmit: (payload: VenueCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function VenueForm({ onSubmit, onCancel, isSubmitting }: VenueFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: "",
      location: "",
      capacity: 0,
      venue_type: "",
      description: "",
    },
  });

  const submit = async (values: VenueFormValues) => {
    await onSubmit({
      name: values.name,
      location: values.location,
      capacity: values.capacity,
      venue_type: values.venue_type || undefined,
      description: values.description || undefined,
    });
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <FormField
        label="Name"
        error={errors.name}
        registration={register("name")}
      />

      <FormField
        label="Location"
        error={errors.location}
        registration={register("location")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Capacity"
          type="number"
          error={errors.capacity}
          registration={register("capacity", { valueAsNumber: true })}
        />
        <FormField
          label="Venue Type (optional)"
          error={errors.venue_type}
          registration={register("venue_type")}
        />
      </div>

      <FormField
        label="Description (optional)"
        type="textarea"
        error={errors.description}
        registration={register("description")}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          Create Venue
        </Button>
      </div>
    </form>
  );
}

export default VenueForm;
