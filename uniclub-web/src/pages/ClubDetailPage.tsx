import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../api/services/authService";
import { getClubLocalProfile, upsertClubLocalProfile } from "../api/services/clubProfileService";
import { deleteClub } from "../api/services/clubService";
import { canManageClubResource, canPerformAction, isMember, isStaffRole } from "../auth/permissions";
import { useClubNetwork } from "../hooks/useReports";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EditableField from "../components/common/EditableField";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import type { ClubLocalProfile } from "../types";

function ClubDetailPage() {
  const currentUser = getCurrentUser();
  const role = currentUser?.role;
  const userClubId = currentUser?.clubId;
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const parsedClubId = Number.parseInt(params.id ?? "", 10);
  const isValidClubId = Number.isInteger(parsedClubId) && parsedClubId > 0;
  const clubId = isValidClubId ? parsedClubId : 0;
  const canManageClub = canPerformAction(role, "update_club") && canManageClubResource(role, userClubId, clubId);
  const [profileRevision, setProfileRevision] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const networkQuery = useClubNetwork(clubId);

  const deleteMutation = useMutation({
    mutationFn: () => deleteClub(clubId),
    onSuccess: async () => {
      toast.success("Club deleted.");
      await queryClient.invalidateQueries({ queryKey: ["clubs"] });
      navigate("/clubs");
    },
  });

  if (!isValidClubId) {
    return <ErrorMessage message="Invalid club ID." />;
  }

  if (networkQuery.isLoading) {
    return <LoadingSpinner />;
  }

  if (networkQuery.isError) {
    return <ErrorMessage message="Could not load club details." />;
  }

  const report = networkQuery.data;
  if (!report) {
    return <ErrorMessage message="Club not found." />;
  }

  const club = report.club;
  const advisor = report.advisor;
  const members = report.members;
  const boardMembers = report.board_members;
  const events = report.events;
  const messages = report.messages;
  const counts = report.counts;

  const localProfile = getClubLocalProfile(clubId);
  const categoryValue = localProfile.category ?? club.category;
  const descriptionValue = localProfile.description ?? club.description;
  const foundedDateValue = localProfile.founded_date ?? club.founded_date;

  const saveLocal = (payload: Partial<ClubLocalProfile>) => {
    upsertClubLocalProfile(clubId, payload);
    setProfileRevision((prev) => prev + 1);
  };

  const copyValue = async (value: string, label: string) => {
    if (!value.trim()) {
      toast.error(`${label} is empty.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  return (
    <section className="space-y-4" key={`club-profile-${profileRevision}`}>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="headline text-3xl font-bold text-ink">{club.name}</h2>
            <p className="mt-2 text-slate">{descriptionValue}</p>
            <p className="mt-2 text-sm text-slate">Category: {categoryValue}</p>
            <p className="mt-1 text-sm text-slate">
              Founded Date: {new Date(foundedDateValue).toLocaleDateString()}
            </p>
            {isMember(role) ? <p className="mt-2 text-xs text-slate">Read-only for member role.</p> : null}
            {isStaffRole(role) && !canManageClub ? (
              <p className="mt-2 text-xs text-slate">You can only manage your own club resources.</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {canManageClub && showDeleteConfirm ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <span className="text-sm text-red-700">Confirm delete?</span>
                <Button
                  variant="ghost"
                  className="!border-red-300 !text-red-700"
                  isLoading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  Yes, delete
                </Button>
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : canManageClub ? (
              <Button
                variant="ghost"
                className="!border-red-300 !text-red-700"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Club
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Summary counts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-slate">Members</p>
          <p className="headline mt-2 text-3xl font-semibold">{counts?.members ?? members.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate">Board Members</p>
          <p className="headline mt-2 text-3xl font-semibold">{counts?.board_members ?? boardMembers.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate">Events</p>
          <p className="headline mt-2 text-3xl font-semibold">{counts?.events ?? events.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate">Messages</p>
          <p className="headline mt-2 text-3xl font-semibold">{counts?.messages ?? messages.length}</p>
        </Card>
      </div>

      <Card>
        <h3 className="headline text-xl font-semibold text-ink">Club Profile</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <EditableField
            label="Category"
            canEdit={canManageClub}
            value={categoryValue}
            onSave={async (nextValue) => {
              if (!canManageClub) {
                toast.error("You can only manage your own club resources.");
                return;
              }
              saveLocal({ category: nextValue });
              toast.success("Category saved locally.");
            }}
          />
          <EditableField
            label="Founded Date (YYYY-MM-DD)"
            canEdit={canManageClub}
            value={foundedDateValue}
            onSave={async (nextValue) => {
              if (!canManageClub) {
                toast.error("You can only manage your own club resources.");
                return;
              }
              saveLocal({ founded_date: nextValue });
              toast.success("Founded date saved locally.");
            }}
          />
          <div className="md:col-span-2">
            <EditableField
              label="Description"
              multiline
              canEdit={canManageClub}
              value={descriptionValue}
              onSave={async (nextValue) => {
                if (!canManageClub) {
                  toast.error("You can only manage your own club resources.");
                  return;
                }
                saveLocal({ description: nextValue });
                toast.success("Description saved locally.");
              }}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="headline text-xl font-semibold text-ink">Club Communication</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <EditableField
            label="Contact Email"
            canEdit={canManageClub}
            value={localProfile.contact_email ?? ""}
            placeholder="No contact email"
            onSave={async (nextValue) => {
              if (!canManageClub) {
                toast.error("You can only manage your own club resources.");
                return;
              }
              saveLocal({ contact_email: nextValue });
              toast.success("Contact email saved locally.");
            }}
          />
          <EditableField
            label="Contact Phone"
            canEdit={canManageClub}
            value={localProfile.contact_phone ?? ""}
            placeholder="No contact phone"
            onSave={async (nextValue) => {
              if (!canManageClub) {
                toast.error("You can only manage your own club resources.");
                return;
              }
              saveLocal({ contact_phone: nextValue });
              toast.success("Contact phone saved locally.");
            }}
          />
          <EditableField
            label="Preferred Channel"
            canEdit={canManageClub}
            value={localProfile.communication_channel ?? ""}
            placeholder="No preferred channel"
            onSave={async (nextValue) => {
              if (!canManageClub) {
                toast.error("You can only manage your own club resources.");
                return;
              }
              saveLocal({ communication_channel: nextValue });
              toast.success("Preferred channel saved locally.");
            }}
          />
          <EditableField
            label="Social Link"
            canEdit={canManageClub}
            value={localProfile.social_link ?? ""}
            placeholder="No social link"
            onSave={async (nextValue) => {
              if (!canManageClub) {
                toast.error("You can only manage your own club resources.");
                return;
              }
              saveLocal({ social_link: nextValue });
              toast.success("Social link saved locally.");
            }}
          />
        </div>
      </Card>

      <Card>
        <h3 className="headline text-xl font-semibold text-ink">Sponsor Communication</h3>
        {!localProfile.sponsor_contact_name && !localProfile.contact_email ? (
          <p className="mt-2 text-sm text-slate">
            No sponsor contact info available yet. Add sponsor contact info below.
          </p>
        ) : null}

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <EditableField
            label="Primary Contact Person"
            canEdit={canManageClub}
            value={localProfile.sponsor_contact_name ?? ""}
            placeholder="Not set"
            onSave={async (nextValue) => {
              if (!canManageClub) {
                toast.error("You can only manage your own club resources.");
                return;
              }
              saveLocal({ sponsor_contact_name: nextValue });
              toast.success("Sponsor contact person saved locally.");
            }}
          />
          <EditableField
            label="Primary Contact Role"
            canEdit={canManageClub}
            value={localProfile.sponsor_contact_role ?? ""}
            placeholder="Not set"
            onSave={async (nextValue) => {
              if (!canManageClub) {
                toast.error("You can only manage your own club resources.");
                return;
              }
              saveLocal({ sponsor_contact_role: nextValue });
              toast.success("Sponsor contact role saved locally.");
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => void copyValue(localProfile.contact_email ?? "", "Email")}>
            Copy Email
          </Button>
          <Button variant="ghost" onClick={() => void copyValue(localProfile.contact_phone ?? "", "Phone")}>
            Copy Phone
          </Button>
          <Button
            variant="ghost"
            onClick={() => void copyValue(localProfile.communication_channel ?? "", "Preferred channel")}
          >
            Copy Channel
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Advisor</h3>
          {!advisor ? (
            <p className="mt-2 text-sm text-slate">No advisor assigned.</p>
          ) : (
            <div className="mt-2 space-y-1 text-sm text-slate">
              <p className="font-medium text-ink">{advisor.full_name}</p>
              <p>{advisor.email}</p>
              <p>{advisor.department}</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Board Members</h3>
          {boardMembers.length === 0 ? (
            <p className="mt-2 text-sm text-slate">No board members assigned.</p>
          ) : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {boardMembers.map((member) => (
              <li key={member.id}>
                {member.first_name} {member.last_name} • {member.role}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Members</h3>
          {members.length === 0 ? (
            <p className="mt-2 text-sm text-slate">No members found.</p>
          ) : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {members.map((member) => (
              <li key={member.id}>
                {member.first_name} {member.last_name} • {member.department}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Recent Events</h3>
          {events.length === 0 ? (
            <p className="mt-2 text-sm text-slate">No events found.</p>
          ) : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {events.slice(0, 5).map((event) => (
              <li key={event.id}>
                {event.title} • {event.status} •{" "}
                {new Date(event.event_start).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="headline text-xl font-semibold text-ink">Messages</h3>
        {messages.length === 0 ? (
          <p className="mt-2 text-sm text-slate">No messages found.</p>
        ) : null}
        <ul className="mt-2 space-y-2 text-sm text-slate">
          {messages.slice(0, 5).map((message) => (
            <li key={message.id}>
              {message.subject} • {message.sender_name ?? `user #${message.sender_user_id}`}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

export default ClubDetailPage;
