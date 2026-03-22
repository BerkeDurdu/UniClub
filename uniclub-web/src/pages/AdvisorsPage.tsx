import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCurrentUser } from "../api/services/authService";
import { canPerformAction, isMember, isSameClub, isStaffRole } from "../auth/permissions";
import { getClubs } from "../api/services/clubService";
import { useAdvisors, useCreateAdvisor } from "../hooks/useAdvisors";
import type { AdvisorCreatePayload } from "../types";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import Modal from "../components/common/Modal";
import AdvisorForm from "../components/forms/AdvisorForm";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

function AdvisorsPage() {
  const currentUser = getCurrentUser();
  const role = currentUser?.role;
  const userClubId = currentUser?.clubId;
  const canCreateAdvisor = canPerformAction(role, "create_advisor");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const advisorsQuery = useAdvisors();
  const clubsQuery = useQuery({ queryKey: ["clubs"], queryFn: () => getClubs({ limit: 200 }) });
  const createAdvisorMutation = useCreateAdvisor();

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

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const advisor of advisorsQuery.data ?? []) {
      if (advisor.department) set.add(advisor.department);
    }
    return ["", ...Array.from(set).sort()];
  }, [advisorsQuery.data]);

  const filteredAdvisors = useMemo(() => {
    let result = advisorsQuery.data ?? [];
    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.full_name.toLowerCase().includes(lower) ||
          a.email.toLowerCase().includes(lower) ||
          a.department.toLowerCase().includes(lower)
      );
    }
    if (departmentFilter) {
      result = result.filter((a) => a.department === departmentFilter);
    }
    return result;
  }, [advisorsQuery.data, debouncedSearch, departmentFilter]);

  const handleCreate = async (payload: AdvisorCreatePayload) => {
    if (!canCreateAdvisor) {
      toast.error("You do not have permission to add advisors.");
      return;
    }
    if (isStaffRole(role) && !isSameClub(userClubId, payload.club_id ?? undefined)) {
      toast.error("You can only manage your own club resources.");
      return;
    }
    await createAdvisorMutation.mutateAsync(payload);
    setIsFormOpen(false);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Advisors</h2>
          <p className="mt-1 text-slate">Manage faculty advisors assigned to clubs.</p>
          {isMember(role) ? <p className="mt-2 text-xs text-slate">Read-only for member role.</p> : null}
        </div>
        {canCreateAdvisor ? (
          <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
            Add Advisor
          </Button>
        ) : null}
      </div>

      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search advisors"
            className="rounded-lg border border-slate/30 px-3 py-2"
          />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-slate/30 px-3 py-2"
          >
            {departments.map((d) => (
              <option key={d || "all"} value={d}>
                {d || "All departments"}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {advisorsQuery.isError ? <ErrorMessage message="Could not load advisors." /> : null}

      {advisorsQuery.isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {filteredAdvisors.length === 0 && !advisorsQuery.isLoading ? (
        <EmptyState
          title="No Advisors Found"
          description="No advisors matched your filters or none have been created yet."
        />
      ) : null}

      {filteredAdvisors.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate/20 text-slate">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Department</th>
                  <th className="px-2 py-2">Assigned Date</th>
                  <th className="px-2 py-2">Club</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdvisors.map((advisor) => (
                  <tr key={advisor.id} className="border-b border-slate/10">
                    <td className="px-2 py-2 font-medium text-ink">{advisor.full_name}</td>
                    <td className="px-2 py-2 text-slate">{advisor.email}</td>
                    <td className="px-2 py-2 text-slate">{advisor.department}</td>
                    <td className="px-2 py-2 text-slate">
                      {new Date(advisor.assigned_date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 text-slate">
                      {advisor.club_id ? clubMap.get(advisor.club_id) ?? `Club #${advisor.club_id}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {canCreateAdvisor ? (
        <Modal title="Add Advisor" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
          <AdvisorForm
            clubs={selectableClubs}
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={createAdvisorMutation.isPending}
          />
        </Modal>
      ) : null}
    </section>
  );
}

export default AdvisorsPage;
