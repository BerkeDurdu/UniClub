import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { getClubLocalProfile, upsertClubLocalProfile } from "../api/services/clubProfileService";
import { useParams } from "react-router-dom";
import { getAdvisors } from "../api/services/advisorService";
import { getBoardMembers } from "../api/services/boardMemberService";
import { getClubById } from "../api/services/clubService";
import { getMembers } from "../api/services/memberService";
import { getMessagesByClub } from "../api/services/messageService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EditableField from "../components/common/EditableField";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import type { ClubLocalProfile } from "../types";

function ClubDetailPage() {
  const params = useParams();
  const parsedClubId = Number.parseInt(params.id ?? "", 10);
  const isValidClubId = Number.isInteger(parsedClubId) && parsedClubId > 0;
  const clubId = isValidClubId ? parsedClubId : 0;
  const [profileRevision, setProfileRevision] = useState(0);

  const clubQuery = useQuery({ queryKey: ["club", clubId], queryFn: () => getClubById(clubId), enabled: isValidClubId });
  const membersQuery = useQuery({ queryKey: ["club-members", clubId], queryFn: () => getMembers({ club_id: clubId, limit: 200 }), enabled: isValidClubId });
  const boardQuery = useQuery({ queryKey: ["board-members", clubId], queryFn: getBoardMembers, enabled: isValidClubId });
  const advisorsQuery = useQuery({ queryKey: ["advisors", clubId], queryFn: getAdvisors, enabled: isValidClubId });
  const messagesQuery = useQuery({ queryKey: ["club-messages", clubId], queryFn: () => getMessagesByClub(clubId), enabled: isValidClubId });

  if (!isValidClubId) {
    return <ErrorMessage message="Invalid club ID." />;
  }

  if ([clubQuery, membersQuery, boardQuery, advisorsQuery, messagesQuery].some((query) => query.isLoading)) {
    return <LoadingSpinner />;
  }

  if ([clubQuery, membersQuery, boardQuery, advisorsQuery, messagesQuery].some((query) => query.isError)) {
    return <ErrorMessage message="Could not load club details." />;
  }

  const club = clubQuery.data;
  if (!club) {
    return <ErrorMessage message="Club not found." />;
  }

  const localProfile = getClubLocalProfile(clubId);
  const categoryValue = localProfile.category ?? club.category;
  const descriptionValue = localProfile.description ?? club.description;
  const foundedDateValue = localProfile.founded_date ?? club.founded_date;

  const saveLocal = (payload: Partial<ClubLocalProfile>) => {
    // TODO: Replace local fallback with backend update endpoint when available.
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

  const boardMembers = (boardQuery.data ?? []).filter((item) => item.club_id === clubId);
  const advisors = (advisorsQuery.data ?? []).filter((item) => item.club_id === clubId);

  return (
    <section className="space-y-4" key={`club-profile-${profileRevision}`}>
      <Card>
        <h2 className="headline text-3xl font-bold text-ink">{club.name}</h2>
        <p className="mt-2 text-slate">{descriptionValue}</p>
        <p className="mt-2 text-sm text-slate">Category: {categoryValue}</p>
        <p className="mt-1 text-sm text-slate">Founded Date: {new Date(foundedDateValue).toLocaleDateString()}</p>
      </Card>

      <Card>
        <h3 className="headline text-xl font-semibold text-ink">Club Profile</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <EditableField
            label="Category"
            value={categoryValue}
            onSave={async (nextValue) => {
              saveLocal({ category: nextValue });
              toast.success("Category saved locally.");
            }}
          />
          <EditableField
            label="Founded Date (YYYY-MM-DD)"
            value={foundedDateValue}
            onSave={async (nextValue) => {
              saveLocal({ founded_date: nextValue });
              toast.success("Founded date saved locally.");
            }}
          />
          <div className="md:col-span-2">
            <EditableField
              label="Description"
              multiline
              value={descriptionValue}
              onSave={async (nextValue) => {
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
            value={localProfile.contact_email ?? ""}
            placeholder="No contact email"
            onSave={async (nextValue) => {
              saveLocal({ contact_email: nextValue });
              toast.success("Contact email saved locally.");
            }}
          />
          <EditableField
            label="Contact Phone"
            value={localProfile.contact_phone ?? ""}
            placeholder="No contact phone"
            onSave={async (nextValue) => {
              saveLocal({ contact_phone: nextValue });
              toast.success("Contact phone saved locally.");
            }}
          />
          <EditableField
            label="Preferred Channel"
            value={localProfile.communication_channel ?? ""}
            placeholder="No preferred channel"
            onSave={async (nextValue) => {
              saveLocal({ communication_channel: nextValue });
              toast.success("Preferred channel saved locally.");
            }}
          />
          <EditableField
            label="Social Link"
            value={localProfile.social_link ?? ""}
            placeholder="No social link"
            onSave={async (nextValue) => {
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
            value={localProfile.sponsor_contact_name ?? ""}
            placeholder="Not set"
            onSave={async (nextValue) => {
              saveLocal({ sponsor_contact_name: nextValue });
              toast.success("Sponsor contact person saved locally.");
            }}
          />
          <EditableField
            label="Primary Contact Role"
            value={localProfile.sponsor_contact_role ?? ""}
            placeholder="Not set"
            onSave={async (nextValue) => {
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
          {advisors.length === 0 ? <p className="mt-2 text-sm text-slate">No advisors assigned.</p> : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {advisors.map((advisor) => (
              <li key={advisor.id}>{advisor.full_name} • {advisor.email}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Board Members</h3>
          {(boardMembers ?? []).length === 0 ? <p className="mt-2 text-sm text-slate">No board members assigned.</p> : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {boardMembers.map((member) => (
              <li key={member.id}>{member.first_name} {member.last_name} • {member.role}</li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Members</h3>
          {(membersQuery.data ?? []).length === 0 ? <p className="mt-2 text-sm text-slate">No members found.</p> : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {(membersQuery.data ?? []).map((member) => (
              <li key={member.id}>{member.first_name} {member.last_name} • {member.department}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Messages</h3>
          {(messagesQuery.data ?? []).length === 0 ? <p className="mt-2 text-sm text-slate">No messages found.</p> : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {(messagesQuery.data ?? []).slice(0, 5).map((message) => (
              <li key={message.id}>{message.subject} • member #{message.member_id}</li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}

export default ClubDetailPage;
