import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Club, EventCreatePayload, EventStatus, Venue } from "../../types";
import Button from "../common/Button";

const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    status: z.enum(["Scheduled", "Completed", "Canceled"]),
    event_start: z.string().min(1, "Event start is required"),
    event_end: z.string().min(1, "Event end is required"),
    club_id: z.number().int().positive(),
    venue_id: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.event_end) <= new Date(value.event_start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["event_end"],
        message: "event_end must be after event_start",
      });
    }
  });

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  clubs: Club[];
  venues: Venue[];
  onSubmit: (payload: EventCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const statusOptions: EventStatus[] = ["Scheduled", "Completed", "Canceled"];

function EventForm({
  clubs,
  venues,
  onSubmit,
  onCancel,
  isSubmitting,
}: EventFormProps) {
  const defaultClubId = clubs[0]?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "Scheduled",
      event_start: "",
      event_end: "",
      club_id: defaultClubId,
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Title</label>
        <input className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("title")} />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Description</label>
        <textarea className="w-full rounded-lg border border-slate/30 px-3 py-2" rows={3} {...register("description")} />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Status</label>
          <select className="w-full rounded-lg border border-slate/30 px-3 py-2" {...register("status")}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Club</label>
          <select
            className="w-full rounded-lg border border-slate/30 px-3 py-2"
            {...register("club_id", { valueAsNumber: true })}
          >
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
          {errors.club_id && <p className="mt-1 text-xs text-red-600">Club is required</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Event Start</label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-slate/30 px-3 py-2"
            {...register("event_start")}
          />
          {errors.event_start && <p className="mt-1 text-xs text-red-600">{errors.event_start.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Event End</label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-slate/30 px-3 py-2"
            {...register("event_end")}
          />
          {errors.event_end && <p className="mt-1 text-xs text-red-600">{errors.event_end.message}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Venue (optional)</label>
        <select
          className="w-full rounded-lg border border-slate/30 px-3 py-2"
          {...register("venue_id", {
            setValueAs: (value) => (value === "" ? undefined : Number(value)),
          })}
        >
          <option value="">No venue</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} ({venue.capacity})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          Create Event
        </Button>
      </div>
    </form>
  );
}

export default EventForm;
