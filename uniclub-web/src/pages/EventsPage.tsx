import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getClubs } from "../api/services/clubService";
import { createEvent, getEvents } from "../api/services/eventService";
import { getVenues } from "../api/services/venueService";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import EventForm from "../components/forms/EventForm";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { EventCreatePayload, EventStatus } from "../types";

const PAGE_SIZE = 6;

function EventsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<"" | EventStatus>("");
  const [page, setPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["events", status, page],
    queryFn: () =>
      getEvents({
        status: status || undefined,
        sort_by: "event_start",
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
  });

  // Client-side title search since backend events endpoint doesn't support search
  const filteredEvents = useMemo(() => {
    const events = eventsQuery.data ?? [];
    if (!debouncedSearch) return events;
    const lower = debouncedSearch.toLowerCase();
    return events.filter((event) => event.title.toLowerCase().includes(lower));
  }, [eventsQuery.data, debouncedSearch]);

  const clubsQuery = useQuery({ queryKey: ["club-options"], queryFn: () => getClubs({ limit: 200 }) });
  const venuesQuery = useQuery({ queryKey: ["venue-options"], queryFn: getVenues });

  const clubMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const club of clubsQuery.data ?? []) {
      map.set(club.id, club.name);
    }
    return map;
  }, [clubsQuery.data]);

  const createEventMutation = useMutation({
    mutationFn: (payload: EventCreatePayload) => createEvent(payload),
    onSuccess: async () => {
      toast.success("Event created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsFormOpen(false);
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Events</h2>
          <p className="mt-1 text-slate">Explore events, apply filters, and create new ones quickly.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
          Create Event
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(0);
            }}
            placeholder="Search events"
            className="rounded-lg border border-slate/30 px-3 py-2"
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | EventStatus);
              setPage(0);
            }}
            className="rounded-lg border border-slate/30 px-3 py-2"
          >
            <option value="">All statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Canceled">Canceled</option>
          </select>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              disabled={filteredEvents.length < PAGE_SIZE}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {eventsQuery.isError ? <ErrorMessage message="Could not load event data." /> : null}

      {eventsQuery.isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {eventsQuery.data && filteredEvents.length === 0 ? (
        <EmptyState
          title="No Results Found"
          description="No events matched the selected filters."
        />
      ) : null}

      {filteredEvents.length > 0 ? (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="headline text-lg font-semibold text-ink">{event.title}</h3>
                <p className="text-sm text-slate">
                  {new Date(event.event_start).toLocaleString()} - {new Date(event.event_end).toLocaleString()}
                </p>
                <p className="text-xs text-slate">
                  Club: {clubMap.get(event.club_id) ?? `#${event.club_id}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={event.status} />
                <Link className="text-sm font-semibold text-ink underline" to={`/events/${event.id}`}>
                  View details
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="headline mb-4 text-2xl font-semibold text-ink">Create Event</h3>
            <EventForm
              clubs={clubsQuery.data ?? []}
              venues={venuesQuery.data ?? []}
              onSubmit={async (payload) => {
                await createEventMutation.mutateAsync(payload);
              }}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={createEventMutation.isPending}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default EventsPage;
