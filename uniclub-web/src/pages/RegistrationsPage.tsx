import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCurrentUser } from "../api/services/authService";
import { canViewSection, isSameClub, isStaffRole } from "../auth/permissions";
import { getEvents } from "../api/services/eventService";
import { getMembers } from "../api/services/memberService";
import { useRegistrations, useRegisterForEvent } from "../hooks/useRegistrations";
import type { RegistrationCreatePayload } from "../types";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import Modal from "../components/common/Modal";
import RegistrationForm from "../components/forms/RegistrationForm";

function RegistrationsPage() {
  const currentUser = getCurrentUser();
  const role = currentUser?.role;
  const userClubId = currentUser?.clubId;
  const canManageRegistrations = canViewSection(role, "registrations_manage");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState<number | "">("");

  const registrationsQuery = useRegistrations(eventFilter === "" ? undefined : eventFilter);
  const eventsQuery = useQuery({
    queryKey: ["events", "for-registrations"],
    queryFn: () => getEvents({ limit: 200 }),
  });
  const membersQuery = useQuery({
    queryKey: ["members", "for-registrations"],
    queryFn: () => getMembers({ limit: 500 }),
  });
  const registerMutation = useRegisterForEvent();

  const selectableEvents = useMemo(() => {
    const events = eventsQuery.data ?? [];
    if (!isStaffRole(role)) {
      return events;
    }
    return events.filter((event) => isSameClub(userClubId, event.club_id));
  }, [eventsQuery.data, role, userClubId]);

  const selectableEventIds = useMemo(
    () => new Set(selectableEvents.map((event) => event.id)),
    [selectableEvents]
  );

  const selectableMembers = useMemo(() => {
    const members = membersQuery.data ?? [];
    if (!isStaffRole(role)) {
      return members;
    }
    return members.filter((member) => isSameClub(userClubId, member.club_id ?? undefined));
  }, [membersQuery.data, role, userClubId]);

  const selectableMemberIds = useMemo(
    () => new Set(selectableMembers.map((member) => member.id)),
    [selectableMembers]
  );

  const eventMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const event of eventsQuery.data ?? []) {
      map.set(event.id, event.title);
    }
    return map;
  }, [eventsQuery.data]);

  const memberMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of membersQuery.data ?? []) {
      map.set(m.id, `${m.first_name} ${m.last_name}`);
    }
    return map;
  }, [membersQuery.data]);

  const handleCreate = async (payload: RegistrationCreatePayload) => {
    if (!canManageRegistrations) {
      toast.error("You do not have permission to manage registrations.");
      return;
    }
    if (!selectableEventIds.has(payload.event_id) || !selectableMemberIds.has(payload.member_id)) {
      toast.error("You can only manage your own club resources.");
      return;
    }
    await registerMutation.mutateAsync({
      event_id: payload.event_id,
      member_id: payload.member_id,
    });
    setIsFormOpen(false);
  };

  const registrations = registrationsQuery.data ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Registrations</h2>
          <p className="mt-1 text-slate">View and manage event registrations.</p>
        </div>
        {canManageRegistrations ? (
          <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
            Register
          </Button>
        ) : null}
      </div>

      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={eventFilter}
            onChange={(e) =>
              setEventFilter(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="rounded-lg border border-slate/30 px-3 py-2"
          >
            <option value="">All events</option>
            {(eventsQuery.data ?? []).map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {registrationsQuery.isError ? (
        <ErrorMessage message="Could not load registrations." />
      ) : null}

      {registrationsQuery.isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {registrations.length === 0 && !registrationsQuery.isLoading ? (
        <EmptyState
          title="No Registrations Found"
          description="No registrations matched your filters or none exist yet."
        />
      ) : null}

      {registrations.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate/20 text-slate">
                  <th className="px-2 py-2">Member</th>
                  <th className="px-2 py-2">Event</th>
                  <th className="px-2 py-2">Registered At</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-slate/10">
                    <td className="px-2 py-2 font-medium text-ink">
                      {memberMap.get(reg.member_id) ?? `Member #${reg.member_id}`}
                    </td>
                    <td className="px-2 py-2 text-slate">
                      {eventMap.get(reg.event_id) ?? `Event #${reg.event_id}`}
                    </td>
                    <td className="px-2 py-2 text-slate">
                      {new Date(reg.registered_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {canManageRegistrations ? (
        <Modal title="Register for Event" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
          <RegistrationForm
            events={selectableEvents}
            members={selectableMembers}
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={registerMutation.isPending}
          />
        </Modal>
      ) : null}
    </section>
  );
}

export default RegistrationsPage;
