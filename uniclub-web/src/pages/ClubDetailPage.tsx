import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getAdvisors } from "../api/services/advisorService";
import { getBoardMembers } from "../api/services/boardMemberService";
import { getClubById } from "../api/services/clubService";
import { getMembers } from "../api/services/memberService";
import { getMessagesByClub } from "../api/services/messageService";
import Card from "../components/common/Card";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";

function ClubDetailPage() {
  const params = useParams();
  const clubId = Number(params.id);

  const clubQuery = useQuery({ queryKey: ["club", clubId], queryFn: () => getClubById(clubId), enabled: Number.isFinite(clubId) });
  const membersQuery = useQuery({ queryKey: ["club-members", clubId], queryFn: () => getMembers({ club_id: clubId, limit: 200 }), enabled: Number.isFinite(clubId) });
  const boardQuery = useQuery({ queryKey: ["board-members", clubId], queryFn: getBoardMembers, enabled: Number.isFinite(clubId) });
  const advisorsQuery = useQuery({ queryKey: ["advisors", clubId], queryFn: getAdvisors, enabled: Number.isFinite(clubId) });
  const messagesQuery = useQuery({ queryKey: ["club-messages", clubId], queryFn: () => getMessagesByClub(clubId), enabled: Number.isFinite(clubId) });

  if ([clubQuery, membersQuery, boardQuery, advisorsQuery, messagesQuery].some((query) => query.isLoading)) {
    return <LoadingSpinner />;
  }

  if ([clubQuery, membersQuery, boardQuery, advisorsQuery, messagesQuery].some((query) => query.isError)) {
    return <ErrorMessage message="Club detayları alınamadı." />;
  }

  const club = clubQuery.data;
  if (!club) {
    return <ErrorMessage message="Club bulunamadı." />;
  }

  const boardMembers = (boardQuery.data ?? []).filter((item) => item.club_id === clubId);
  const advisors = (advisorsQuery.data ?? []).filter((item) => item.club_id === clubId);

  return (
    <section className="space-y-4">
      <Card>
        <h2 className="headline text-3xl font-bold text-ink">{club.name}</h2>
        <p className="mt-2 text-slate">{club.description}</p>
        <p className="mt-2 text-sm text-slate">Category: {club.category}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Advisor</h3>
          {advisors.length === 0 ? <p className="mt-2 text-sm text-slate">Advisor yok.</p> : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {advisors.map((advisor) => (
              <li key={advisor.id}>{advisor.full_name} • {advisor.email}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Board Members</h3>
          {(boardMembers ?? []).length === 0 ? <p className="mt-2 text-sm text-slate">Board member yok.</p> : null}
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
          {(membersQuery.data ?? []).length === 0 ? <p className="mt-2 text-sm text-slate">Uye yok.</p> : null}
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {(membersQuery.data ?? []).map((member) => (
              <li key={member.id}>{member.first_name} {member.last_name} • {member.department}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Messages</h3>
          {(messagesQuery.data ?? []).length === 0 ? <p className="mt-2 text-sm text-slate">Mesaj yok.</p> : null}
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
