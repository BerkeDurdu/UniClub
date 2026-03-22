import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCurrentUser } from "../api/services/authService";
import { canPerformAction, isMember, isSameClub, isStaffRole } from "../auth/permissions";
import { getEvents } from "../api/services/eventService";
import { useSponsorships, useCreateSponsorship } from "../hooks/useSponsorships";
import type { SponsorshipCreatePayload } from "../types";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import Modal from "../components/common/Modal";
import SponsorshipForm from "../components/forms/SponsorshipForm";

function SponsorshipsPage() {
  const currentUser = getCurrentUser();
  const role = currentUser?.role;
  const userClubId = currentUser?.clubId;
  const canCreateSponsorship = canPerformAction(role, "create_sponsorship");
  const hideFinancialAmounts = isMember(role);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sponsorshipsQuery = useSponsorships();
  const eventsQuery = useQuery({
    queryKey: ["events", "for-sponsorships"],
    queryFn: () => getEvents({ limit: 200 }),
  });
  const createMutation = useCreateSponsorship();

  const eventMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const event of eventsQuery.data ?? []) {
      map.set(event.id, event.title);
    }
    return map;
  }, [eventsQuery.data]);

  const eventClubMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const event of eventsQuery.data ?? []) {
      map.set(event.id, event.club_id);
    }
    return map;
  }, [eventsQuery.data]);

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

  const handleCreate = async (payload: SponsorshipCreatePayload) => {
    if (!canCreateSponsorship) {
      toast.error("You do not have permission to create sponsorships.");
      return;
    }
    if (!selectableEventIds.has(payload.event_id)) {
      toast.error("You can only manage your own club resources.");
      return;
    }
    await createMutation.mutateAsync(payload);
    setIsFormOpen(false);
  };

  const sponsorships = sponsorshipsQuery.data ?? [];

  const canViewAmountForEvent = (eventId: number): boolean => {
    if (isMember(role)) {
      return false;
    }
    if (!isStaffRole(role)) {
      return true;
    }
    const resourceClubId = eventClubMap.get(eventId);
    return isSameClub(userClubId, resourceClubId);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Sponsorships</h2>
          <p className="mt-1 text-slate">Manage event sponsorships and agreements.</p>
        </div>
        {canCreateSponsorship ? (
          <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
            Add Sponsorship
          </Button>
        ) : null}
      </div>

      {sponsorshipsQuery.isError ? <ErrorMessage message="Could not load sponsorships." /> : null}

      {sponsorshipsQuery.isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {sponsorships.length === 0 && !sponsorshipsQuery.isLoading ? (
        <EmptyState
          title="No Sponsorships Found"
          description="No sponsorships have been created yet."
        />
      ) : null}

      {sponsorships.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate/20 text-slate">
                  <th className="px-2 py-2">Sponsor Name</th>
                  {!hideFinancialAmounts ? <th className="px-2 py-2">Amount</th> : null}
                  <th className="px-2 py-2">Agreement Date</th>
                  <th className="px-2 py-2">Event</th>
                </tr>
              </thead>
              <tbody>
                {sponsorships.map((s) => (
                  <tr key={s.id} className="border-b border-slate/10">
                    <td className="px-2 py-2 font-medium text-ink">{s.sponsor_name}</td>
                    {!hideFinancialAmounts ? (
                      <td className="px-2 py-2 text-slate">
                        {canViewAmountForEvent(s.event_id) ? `$${s.amount.toLocaleString()}` : "Restricted"}
                      </td>
                    ) : null}
                    <td className="px-2 py-2 text-slate">
                      {new Date(s.agreement_date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 text-slate">
                      {eventMap.get(s.event_id) ?? `Event #${s.event_id}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {canCreateSponsorship ? (
        <Modal title="Add Sponsorship" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
          <SponsorshipForm
            events={selectableEvents}
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={createMutation.isPending}
          />
        </Modal>
      ) : null}
    </section>
  );
}

export default SponsorshipsPage;
