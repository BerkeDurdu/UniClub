import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAuthMeContext, getCurrentUser } from "../api/services/authService";
import { deleteEvent, updateEvent } from "../api/services/eventService";
import { getClubs } from "../api/services/clubService";
import { getVenues } from "../api/services/venueService";
import { getMembers } from "../api/services/memberService";
import { canManageClubResource, canPerformAction, isMember, isSameClub, isStaffRole } from "../auth/permissions";
import {
  registerForEvent,
} from "../api/services/registrationService";
import {
  createParticipant,
} from "../api/services/participantService";
import { useEventNetwork } from "../hooks/useReports";
import AddItemBox from "../components/common/AddItemBox";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EditableField from "../components/common/EditableField";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import EventForm from "../components/forms/EventForm";
import ParticipantForm from "../components/forms/ParticipantForm";
import type { EventUpdatePayload } from "../types";

function EventDetailPage() {
  const currentUser = getCurrentUser();
  const role = currentUser?.role;
  const userClubId = currentUser?.clubId;
  const canManageEventByRole = canPerformAction(role, "update_event");
  const canDeleteEventByRole = canPerformAction(role, "delete_event");
  const canSelfRegister = canPerformAction(role, "self_register_event");
  const canRegisterOtherMembersByRole = canPerformAction(role, "register_other_member");
  const canAddExternalParticipantByRole = canPerformAction(role, "add_external_participant");
  const canAddMetadataLabelByRole = canPerformAction(role, "add_metadata_label");
  const canEditMetadataByRole = canPerformAction(role, "edit_event_metadata");
  const params = useParams();
  const navigate = useNavigate();
  const parsedEventId = Number.parseInt(params.id ?? "", 10);
  const isValidEventId = Number.isInteger(parsedEventId) && parsedEventId > 0;
  const eventId = isValidEventId ? parsedEventId : 0;
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState<number>(0);
  const [eventNote, setEventNote] = useState("No notes yet.");
  const [metadataItems, setMetadataItems] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const networkQuery = useEventNetwork(eventId);
  const membersQuery = useQuery({ queryKey: ["members", "for-registration"], queryFn: () => getMembers({ limit: 300 }) });
  const authContextQuery = useQuery({
    queryKey: ["auth", "me", "context"],
    queryFn: fetchAuthMeContext,
    enabled: isMember(role),
  });
  const clubsQuery = useQuery({ queryKey: ["club-options"], queryFn: () => getClubs({ limit: 200 }) });
  const venuesQuery = useQuery({ queryKey: ["venue-options"], queryFn: getVenues });

  const registerMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: async () => {
      toast.success("Registration successful.");
      await queryClient.invalidateQueries({ queryKey: ["report", "event-network", eventId] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Registration failed.";
      toast.error(message);
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: createParticipant,
    onSuccess: async () => {
      toast.success("Participant added.");
      await queryClient.invalidateQueries({ queryKey: ["report", "event-network", eventId] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not add participant.";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: EventUpdatePayload) => updateEvent(eventId, payload),
    onSuccess: async () => {
      toast.success("Event updated.");
      await queryClient.invalidateQueries({ queryKey: ["report", "event-network", eventId] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(eventId),
    onSuccess: async () => {
      toast.success("Event deleted.");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
  });

  if (!isValidEventId) {
    return <ErrorMessage message="Invalid event ID." />;
  }

  if ([networkQuery, membersQuery, venuesQuery].some((q) => q.isLoading)) {
    return <LoadingSpinner />;
  }

  if (networkQuery.isError) {
    return <ErrorMessage message="Could not load event details." />;
  }

  const report = networkQuery.data;
  if (!report) {
    return <ErrorMessage message="Event not found." />;
  }

  const event = report.event;
  const venue = report.venue;
  const budget = report.budget;
  const registrations = report.registrations;
  const participants = report.participants;
  const sponsorships = report.sponsorships;
  const counts = report.counts;

  const canManageThisEvent = canManageEventByRole && canManageClubResource(role, userClubId, event.club_id);
  const canDeleteThisEvent = canDeleteEventByRole && canManageClubResource(role, userClubId, event.club_id);
  const canManageRegistrationsForEvent =
    canRegisterOtherMembersByRole && canManageClubResource(role, userClubId, event.club_id);
  const canAddExternalParticipantForEvent =
    canAddExternalParticipantByRole && canManageClubResource(role, userClubId, event.club_id);
  const canEditMetadataForEvent = canEditMetadataByRole && canManageClubResource(role, userClubId, event.club_id);
  const canAddMetadataLabelForEvent =
    canAddMetadataLabelByRole && canManageClubResource(role, userClubId, event.club_id);
  const canViewSponsorshipAmountsForEvent =
    !isMember(role) && (!isStaffRole(role) || canManageClubResource(role, userClubId, event.club_id));

  const registeredMemberIds = new Set(registrations.map((r) => r.member_id));
  const registerableMembers = (membersQuery.data ?? []).filter(
    (member) =>
      !registeredMemberIds.has(member.id) &&
      (!isStaffRole(role) || isSameClub(event.club_id, member.club_id ?? undefined))
  );

  const isRegistrationDisabled =
    event.status === "Completed" || event.status === "Canceled";
  const registrationDisabledReason =
    event.status === "Completed"
      ? "Registrations are closed for completed events."
      : "Registrations are closed for canceled events.";

  const memberProfileId = authContextQuery.data?.memberProfileId ?? null;
  const isAlreadyRegisteredByCurrentMember =
    memberProfileId !== null && registrations.some((registration) => registration.member_id === memberProfileId);

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
            {isMember(role) ? <p className="mt-2 text-xs text-slate">Read-only for member role.</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge status={event.status} />
            {canManageThisEvent ? (
              <Button variant="ghost" onClick={() => setIsEditOpen(true)}>
                Edit
              </Button>
            ) : null}
            {canDeleteThisEvent && showDeleteConfirm ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <span className="text-sm text-red-700">Confirm delete?</span>
                <Button
                  variant="ghost"
                  className="!border-red-300 !text-red-700"
                  isLoading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  Yes
                </Button>
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  No
                </Button>
              </div>
            ) : canDeleteThisEvent ? (
              <Button
                variant="ghost"
                className="!border-red-300 !text-red-700"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Summary counts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-slate">Registrations</p>
          <p className="headline mt-2 text-3xl font-semibold">{counts?.registrations ?? registrations.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate">Participants</p>
          <p className="headline mt-2 text-3xl font-semibold">{counts?.participants ?? participants.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate">Sponsorships</p>
          <p className="headline mt-2 text-3xl font-semibold">{counts?.sponsorships ?? sponsorships.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate">Budget Status</p>
          <p className="headline mt-2 text-3xl font-semibold">
            {isMember(role)
              ? "Restricted"
              : budget
                ? `$${budget.actual_amount.toLocaleString()}`
                : "N/A"}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Budget</h3>
          {isMember(role) ? (
            <p className="mt-2 text-sm text-slate">Financial details are restricted for member role.</p>
          ) : budget ? (
            <div className="mt-2 space-y-1 text-sm text-slate">
              <p>Planned: ${budget.planned_amount.toLocaleString()}</p>
              <p>Actual: ${budget.actual_amount.toLocaleString()}</p>
              <p>
                Variance:{" "}
                <span
                  className={`font-semibold ${
                    budget.planned_amount - budget.actual_amount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${(budget.planned_amount - budget.actual_amount).toLocaleString()}
                </span>
              </p>
              <p>Notes: {budget.notes || "-"}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate">No budget record found.</p>
          )}
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Sponsorships</h3>
          {sponsorships.length === 0 ? (
            <p className="mt-2 text-sm text-slate">No sponsorships yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-slate">
              {sponsorships.map((sponsorship) => (
                <li key={sponsorship.id}>
                  {!canViewSponsorshipAmountsForEvent
                    ? sponsorship.sponsor_name
                    : `${sponsorship.sponsor_name} • $${sponsorship.amount.toLocaleString()}`}
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
            <span className="text-xs text-slate">{registrations.length} registered</span>
          </div>

          <div className="mt-3 space-y-2">
            {canManageRegistrationsForEvent ? (
              <>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(Number(e.target.value))}
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
                  onClick={() => {
                    if (!canManageRegistrationsForEvent) {
                      toast.error("You do not have permission to manage registrations.");
                      return;
                    }
                    if (selectedMemberId === 0) return;
                    registerMutation.mutate({
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
              </>
            ) : isMember(role) ? (
              <>
                <Button
                  variant="secondary"
                  disabled={
                    !canSelfRegister ||
                    isRegistrationDisabled ||
                    authContextQuery.isLoading ||
                    memberProfileId === null ||
                    isAlreadyRegisteredByCurrentMember
                  }
                  title={
                    isRegistrationDisabled
                      ? registrationDisabledReason
                      : isAlreadyRegisteredByCurrentMember
                        ? "You are already registered."
                        : "Register yourself for this event"
                  }
                  isLoading={registerMutation.isPending}
                  onClick={() => {
                    if (!canSelfRegister) {
                      toast.error("You do not have permission to register for this event.");
                      return;
                    }
                    if (memberProfileId === null) {
                      toast.error("Your member profile could not be resolved.");
                      return;
                    }
                    if (isAlreadyRegisteredByCurrentMember) {
                      toast.error("You are already registered for this event.");
                      return;
                    }
                    registerMutation.mutate({
                      event_id: eventId,
                      member_id: memberProfileId,
                    });
                  }}
                >
                  Register Myself
                </Button>
                {isAlreadyRegisteredByCurrentMember ? (
                  <p className="text-xs text-slate">You are already registered.</p>
                ) : null}
                {memberProfileId === null && !authContextQuery.isLoading ? (
                  <p className="text-xs text-red-600">Member profile not found for this account.</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate">Read-only for member role.</p>
            )}
          </div>

          <ul className="mt-3 space-y-1 text-sm text-slate">
            {registrations.map((registration) => (
              <li key={registration.id}>Member #{registration.member_id}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Participants</h3>
          {canAddExternalParticipantForEvent ? (
            <ParticipantForm
              eventId={eventId}
              isSubmitting={addParticipantMutation.isPending}
              onSubmit={async (payload) => {
                if (!canAddExternalParticipantForEvent) {
                  toast.error("You do not have permission to add external participants.");
                  return;
                }
                await addParticipantMutation.mutateAsync(payload);
              }}
            />
          ) : (
            <p className="mt-2 text-sm text-slate">Read-only for member role.</p>
          )}
          <ul className="mt-3 space-y-1 text-sm text-slate">
            {participants.map((participant) => (
              <li key={participant.id}>
                {participant.first_name} {participant.last_name}
                {participant.member_id ? ` • member #${participant.member_id}` : " • external"}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="headline text-xl font-semibold text-ink">Event Metadata</h3>
        <div className="mt-3 space-y-3">
          <EditableField
            label="Event Note"
            multiline
            canEdit={canEditMetadataForEvent}
            value={eventNote}
            onSave={async (nextValue) => {
              if (!canEditMetadataForEvent) {
                toast.error("You do not have permission to edit event metadata.");
                return;
              }
              setEventNote(nextValue);
              toast.success("Event note updated locally.");
            }}
          />

          {canAddMetadataLabelForEvent ? (
            <AddItemBox
              title="Metadata Labels"
              placeholder="Add a label, e.g. keynote"
              buttonLabel="Add Label"
              validate={(value) =>
                metadataItems.some((item) => item.toLowerCase() === value.toLowerCase())
                  ? "This label already exists."
                  : null
              }
              onAdd={async (value) => {
                if (!canAddMetadataLabelForEvent) {
                  toast.error("You do not have permission to add metadata labels.");
                  return;
                }
                setMetadataItems((prev) => [...prev, value]);
                toast.success("Metadata label added.");
              }}
            />
          ) : null}

          {metadataItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {metadataItems.map((item) => (
                <span key={item} className="rounded-full bg-[#EAF0F8] px-3 py-1 text-xs font-semibold text-ink">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate">No metadata labels yet.</p>
          )}
        </div>
      </Card>

      {canManageThisEvent ? (
        <Modal title="Edit Event" isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
          <EventForm
            clubs={
              isStaffRole(role)
                ? (clubsQuery.data ?? []).filter((club) => isSameClub(userClubId, club.id))
                : (clubsQuery.data ?? [])
            }
            venues={venuesQuery.data ?? []}
            initialValues={{
              title: event.title,
              description: event.description,
              status: event.status,
              event_start: event.event_start.slice(0, 16),
              event_end: event.event_end.slice(0, 16),
              club_id: event.club_id,
              venue_id: event.venue_id ?? undefined,
            }}
            onSubmit={async (payload) => {
              if (!canManageThisEvent || (isStaffRole(role) && !isSameClub(userClubId, payload.club_id))) {
                toast.error("You do not have permission to update events.");
                return;
              }
              await updateMutation.mutateAsync(payload);
            }}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={updateMutation.isPending}
          />
        </Modal>
      ) : null}
    </section>
  );
}

export default EventDetailPage;
