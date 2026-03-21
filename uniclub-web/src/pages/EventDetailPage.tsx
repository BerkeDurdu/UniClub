import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBudgetByEvent } from "../api/services/budgetService";
import { getEventById } from "../api/services/eventService";
import { getMembers } from "../api/services/memberService";
import {
  createParticipant,
  getEventParticipants,
} from "../api/services/participantService";
import {
  getRegistrations,
  registerForEvent,
} from "../api/services/registrationService";
import { getSponsorshipsByEvent } from "../api/services/sponsorshipService";
import { getVenues } from "../api/services/venueService";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ParticipantForm from "../components/forms/ParticipantForm";

function EventDetailPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState<number>(0);

  const eventQuery = useQuery({ queryKey: ["event", eventId], queryFn: () => getEventById(eventId), enabled: Number.isFinite(eventId) });
  const budgetQuery = useQuery({ queryKey: ["event-budget", eventId], queryFn: () => getBudgetByEvent(eventId), enabled: Number.isFinite(eventId) });
  const registrationsQuery = useQuery({ queryKey: ["event-registrations", eventId], queryFn: () => getRegistrations(eventId), enabled: Number.isFinite(eventId) });
  const participantsQuery = useQuery({ queryKey: ["event-participants", eventId], queryFn: () => getEventParticipants(eventId), enabled: Number.isFinite(eventId) });
  const membersQuery = useQuery({ queryKey: ["members", "for-registration"], queryFn: () => getMembers({ limit: 300 }) });
  const sponsorshipsQuery = useQuery({ queryKey: ["event-sponsorships", eventId], queryFn: () => getSponsorshipsByEvent(eventId), enabled: Number.isFinite(eventId) });
  const venuesQuery = useQuery({ queryKey: ["venues", "all"], queryFn: getVenues });

  const registerMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: async () => {
      toast.success("Registration successful.");
      await queryClient.invalidateQueries({ queryKey: ["event-registrations", eventId] });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: createParticipant,
    onSuccess: async () => {
      toast.success("Participant added.");
      await queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
    },
  });

  if (
    [eventQuery, budgetQuery, registrationsQuery, participantsQuery, sponsorshipsQuery, membersQuery, venuesQuery].some(
      (query) => query.isLoading
    )
  ) {
    return <LoadingSpinner />;
  }

  if (
    [eventQuery, registrationsQuery, participantsQuery, sponsorshipsQuery, membersQuery, venuesQuery].some(
      (query) => query.isError
    )
  ) {
    return <ErrorMessage message="Etkinlik detayları alınamadı." />;
  }

  const event = eventQuery.data;
  if (!event) {
    return <ErrorMessage message="Event bulunamadı." />;
  }

  const isRegistrationDisabled =
    event.status === "Completed" || event.status === "Canceled";

  const registrationDisabledReason =
    event.status === "Completed"
      ? "Completed etkinliklere kayıt kapalıdır."
      : "Canceled etkinliklere kayıt kapalıdır.";

  const registeredMemberIds = new Set(
    (registrationsQuery.data ?? []).map((registration) => registration.member_id)
  );

  const venue = (venuesQuery.data ?? []).find((item) => item.id === event.venue_id);

  const registerableMembers = useMemo(
    () => (membersQuery.data ?? []).filter((member) => !registeredMemberIds.has(member.id)),
    [membersQuery.data, registeredMemberIds]
  );

  return (
    <section className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="headline text-3xl font-bold text-ink">{event.title}</h2>
            <p className="mt-2 text-sm text-slate">{event.description}</p>
            <p className="mt-2 text-sm text-slate">
              {new Date(event.event_start).toLocaleString()} - {new Date(event.event_end).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-slate">
              Venue: {venue ? `${venue.name} (${venue.location})` : "Not assigned"}
            </p>
          </div>
          <Badge status={event.status} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Budget</h3>
          {budgetQuery.data ? (
            <div className="mt-2 space-y-1 text-sm text-slate">
              <p>Planned: {budgetQuery.data.planned_amount}</p>
              <p>Actual: {budgetQuery.data.actual_amount}</p>
              <p>Notes: {budgetQuery.data.notes || "-"}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate">Budget kaydı bulunamadı.</p>
          )}
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Sponsorships</h3>
          {(sponsorshipsQuery.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-slate">Sponsorluk yok.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-slate">
              {(sponsorshipsQuery.data ?? []).map((sponsorship) => (
                <li key={sponsorship.id}>
                  {sponsorship.sponsor_name} • {sponsorship.amount}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="headline text-xl font-semibold text-ink">Registrations</h3>
            <span className="text-xs text-slate">{(registrationsQuery.data ?? []).length} kayıt</span>
          </div>

          <div className="mt-3 space-y-2">
            <select
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(Number(event.target.value))}
              className="w-full rounded-lg border border-slate/30 px-3 py-2"
              disabled={isRegistrationDisabled}
              title={isRegistrationDisabled ? registrationDisabledReason : ""}
            >
              <option value={0}>Select member</option>
              {registerableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </option>
              ))}
            </select>

            <Button
              variant="secondary"
              disabled={isRegistrationDisabled || selectedMemberId === 0}
              title={isRegistrationDisabled ? registrationDisabledReason : "Register for Event"}
              isLoading={registerMutation.isPending}
              onClick={async () => {
                if (selectedMemberId === 0) {
                  return;
                }
                await registerMutation.mutateAsync({
                  event_id: eventId,
                  member_id: selectedMemberId,
                });
              }}
            >
              Register for Event
            </Button>
            {isRegistrationDisabled ? (
              <p className="text-xs text-red-600">{registrationDisabledReason}</p>
            ) : null}
          </div>

          <ul className="mt-3 space-y-1 text-sm text-slate">
            {(registrationsQuery.data ?? []).map((registration) => (
              <li key={registration.id}>Member #{registration.member_id}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Participants</h3>
          <ParticipantForm
            eventId={eventId}
            isSubmitting={addParticipantMutation.isPending}
            onSubmit={async (payload) => {
              await addParticipantMutation.mutateAsync(payload);
            }}
          />
          <ul className="mt-3 space-y-1 text-sm text-slate">
            {(participantsQuery.data ?? []).map((participant) => (
              <li key={participant.id}>
                {participant.first_name} {participant.last_name}
                {participant.member_id ? ` • member #${participant.member_id}` : " • external"}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}

export default EventDetailPage;
