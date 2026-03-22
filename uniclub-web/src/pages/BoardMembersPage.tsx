import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCurrentUser } from "../api/services/authService";
import { canViewSection, isSameClub, isStaffRole } from "../auth/permissions";
import { getClubs } from "../api/services/clubService";
import { useBoardMembers, useCreateBoardMember } from "../hooks/useBoardMembers";
import type { BoardMemberCreatePayload, BoardRole } from "../types";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import Modal from "../components/common/Modal";
import BoardMemberForm from "../components/forms/BoardMemberForm";

const ROLES: ("" | BoardRole)[] = [
  "",
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Coordinator",
];

function BoardMembersPage() {
  const currentUser = getCurrentUser();
  const role = currentUser?.role;
  const userClubId = currentUser?.clubId;
  const canManageBoard = canViewSection(role, "board_manage");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"" | BoardRole>("");
  const [clubFilter, setClubFilter] = useState<number | "">("");

  const boardMembersQuery = useBoardMembers();
  const clubsQuery = useQuery({ queryKey: ["clubs"], queryFn: () => getClubs({ limit: 200 }) });
  const createMutation = useCreateBoardMember();

  const clubMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const club of clubsQuery.data ?? []) {
      map.set(club.id, club.name);
    }
    return map;
  }, [clubsQuery.data]);

  const selectableClubs = useMemo(() => {
    const clubs = clubsQuery.data ?? [];
    if (!isStaffRole(role)) {
      return clubs;
    }
    return clubs.filter((club) => isSameClub(userClubId, club.id));
  }, [clubsQuery.data, role, userClubId]);

  const filtered = useMemo(() => {
    let result = boardMembersQuery.data ?? [];
    if (roleFilter) {
      result = result.filter((bm) => bm.role === roleFilter);
    }
    if (clubFilter !== "") {
      result = result.filter((bm) => bm.club_id === clubFilter);
    }
    return result;
  }, [boardMembersQuery.data, roleFilter, clubFilter]);

  const roleBadgeColor: Record<BoardRole, string> = {
    President: "bg-blue-100 text-blue-800",
    "Vice President": "bg-purple-100 text-purple-800",
    Secretary: "bg-green-100 text-green-800",
    Treasurer: "bg-yellow-100 text-yellow-800",
    Coordinator: "bg-pink-100 text-pink-800",
  };

  const handleCreate = async (payload: BoardMemberCreatePayload) => {
    if (!canManageBoard) {
      toast.error("You do not have permission to manage board members.");
      return;
    }
    if (isStaffRole(role) && !isSameClub(userClubId, payload.club_id)) {
      toast.error("You can only manage your own club resources.");
      return;
    }
    await createMutation.mutateAsync(payload);
    setIsFormOpen(false);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Board Members</h2>
          <p className="mt-1 text-slate">View and manage club board members.</p>
        </div>
        {canManageBoard ? (
          <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
            Add Board Member
          </Button>
        ) : null}
      </div>

      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "" | BoardRole)}
            className="rounded-lg border border-slate/30 px-3 py-2"
          >
            {ROLES.map((r) => (
              <option key={r || "all"} value={r}>
                {r || "All roles"}
              </option>
            ))}
          </select>
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-lg border border-slate/30 px-3 py-2"
          >
            <option value="">All clubs</option>
            {(clubsQuery.data ?? []).map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {boardMembersQuery.isError ? <ErrorMessage message="Could not load board members." /> : null}

      {boardMembersQuery.isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {filtered.length === 0 && !boardMembersQuery.isLoading ? (
        <EmptyState
          title="No Board Members Found"
          description="No board members matched your filters or none have been created yet."
        />
      ) : null}

      {filtered.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate/20 text-slate">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Role</th>
                  <th className="px-2 py-2">Club</th>
                  <th className="px-2 py-2">Join Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bm) => (
                  <tr key={bm.id} className="border-b border-slate/10">
                    <td className="px-2 py-2 font-medium text-ink">
                      {bm.first_name} {bm.last_name}
                    </td>
                    <td className="px-2 py-2 text-slate">{bm.email}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadgeColor[bm.role]}`}
                      >
                        {bm.role}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate">
                      {clubMap.get(bm.club_id) ?? `Club #${bm.club_id}`}
                    </td>
                    <td className="px-2 py-2 text-slate">
                      {new Date(bm.join_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {canManageBoard ? (
        <Modal title="Add Board Member" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
          <BoardMemberForm
            clubs={selectableClubs}
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={createMutation.isPending}
          />
        </Modal>
      ) : null}
    </section>
  );
}

export default BoardMembersPage;
