import { useQuery } from "@tanstack/react-query";
import { getMembers } from "../api/services/memberService";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";

function MembersPage() {
  const membersQuery = useQuery({
    queryKey: ["members", "all"],
    queryFn: () => getMembers({ limit: 200 }),
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="headline text-3xl font-bold text-ink">Members</h2>
        <p className="mt-1 text-slate">Tum uye kayitlari.</p>
      </div>

      {membersQuery.isError ? <ErrorMessage message="Member verileri alınamadı." /> : null}

      {membersQuery.isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {membersQuery.data && membersQuery.data.length === 0 ? (
        <EmptyState title="No Results Found" description="Henuz uye kaydi bulunmuyor." />
      ) : null}

      {membersQuery.data && membersQuery.data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {membersQuery.data.map((member) => (
            <Card key={member.id}>
              <h3 className="headline text-lg font-semibold text-ink">
                {member.first_name} {member.last_name}
              </h3>
              <p className="mt-1 text-sm text-slate">{member.email}</p>
              <p className="text-sm text-slate">Department: {member.department}</p>
              <p className="text-sm text-slate">Student ID: {member.student_id}</p>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default MembersPage;
