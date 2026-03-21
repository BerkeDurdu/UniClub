import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getEvents } from "../api/services/eventService";
import { getMembers } from "../api/services/memberService";
import { getRegistrations } from "../api/services/registrationService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";

type PeriodKey = "30d" | "semester" | "all";
type SortKey = "events" | "name";

const PERIOD_TO_DAYS: Record<PeriodKey, number | null> = {
  "30d": 30,
  semester: 120,
  all: null,
};

function MembersPage() {
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("events");
  const [showAllMembers, setShowAllMembers] = useState(false);

  const membersQuery = useQuery({
    queryKey: ["members", "all"],
    queryFn: () => getMembers({ limit: 500 }),
  });

  const eventsQuery = useQuery({
    queryKey: ["events", "for-members-analytics"],
    queryFn: () => getEvents({ limit: 500 }),
  });

  const registrationsQuery = useQuery({
    queryKey: ["registrations", "members-analytics"],
    queryFn: () => getRegistrations(),
  });

  const isLoading =
    membersQuery.isLoading ||
    eventsQuery.isLoading ||
    registrationsQuery.isLoading;

  const hasError =
    membersQuery.isError ||
    eventsQuery.isError ||
    registrationsQuery.isError;

  const analytics = useMemo(() => {
    const members = membersQuery.data ?? [];
    const registrations = registrationsQuery.data ?? [];
    const events = eventsQuery.data ?? [];

    const days = PERIOD_TO_DAYS[period];
    const cutoff =
      days === null
        ? null
        : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const validEventIds = new Set(events.map((event) => event.id));
    const filteredRegistrations = registrations.filter((registration) => {
      if (!validEventIds.has(registration.event_id)) {
        return false;
      }
      if (!cutoff) {
        return true;
      }
      return new Date(registration.registered_at) >= cutoff;
    });

    const countMap = new Map<number, number>();
    for (const registration of filteredRegistrations) {
      countMap.set(registration.member_id, (countMap.get(registration.member_id) ?? 0) + 1);
    }

    const activeRows = members
      .map((member) => ({
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        department: member.department,
        attended_event_count: countMap.get(member.id) ?? 0,
      }))
      .filter((row) => row.attended_event_count > 0);

    const sorted = [...activeRows].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (b.attended_event_count !== a.attended_event_count) {
        return b.attended_event_count - a.attended_event_count;
      }
      return a.name.localeCompare(b.name);
    });

    const averageEvents =
      sorted.length === 0
        ? 0
        : sorted.reduce((sum, row) => sum + row.attended_event_count, 0) /
          sorted.length;

    return {
      activeRows: sorted,
      totalMembers: members.length,
      totalEvents: events.length,
      totalActiveParticipants: sorted.length,
      averageEventsPerActiveMember: averageEvents,
      topParticipants: sorted.slice(0, 5),
    };
  }, [eventsQuery.data, membersQuery.data, period, registrationsQuery.data, sortBy]);

  const visibleRows = showAllMembers
    ? analytics.activeRows
    : analytics.activeRows.slice(0, 12);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="headline text-3xl font-bold text-ink">Members</h2>
        <p className="mt-1 text-slate">
          Active participation analytics for event engagement.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as PeriodKey)}
            className="rounded-lg border border-slate/30 px-3 py-2"
          >
            <option value="30d">Last 30 days</option>
            <option value="semester">This semester</option>
            <option value="all">All time</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="rounded-lg border border-slate/30 px-3 py-2"
          >
            <option value="events">Sort by event count</option>
            <option value="name">Sort by member name</option>
          </select>

          <Button variant="ghost" onClick={() => setShowAllMembers((prev) => !prev)}>
            {showAllMembers ? "Show fewer rows" : "Show all active members"}
          </Button>
        </div>
      </Card>

      {hasError ? <ErrorMessage message="Could not load member analytics." /> : null}

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-slate">Active Participants</p>
            <p className="headline mt-2 text-3xl font-semibold">
              {analytics.totalActiveParticipants}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate">Average Events / Active Member</p>
            <p className="headline mt-2 text-3xl font-semibold">
              {analytics.averageEventsPerActiveMember.toFixed(1)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate">Total Members</p>
            <p className="headline mt-2 text-3xl font-semibold">{analytics.totalMembers}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate">Total Events</p>
            <p className="headline mt-2 text-3xl font-semibold">{analytics.totalEvents}</p>
          </Card>
        </div>
      ) : null}

      {!isLoading && analytics.topParticipants.length > 0 ? (
        <Card>
          <h3 className="headline text-xl font-semibold text-ink">Top Participants</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {analytics.topParticipants.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate/20 bg-white/70 p-3">
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="text-sm text-slate">{item.department}</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {item.attended_event_count} events
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {!isLoading && analytics.activeRows.length === 0 ? (
        <EmptyState
          title="No Active Participation"
          description="No members with event participation were found for this period."
        />
      ) : null}

      {!isLoading && visibleRows.length > 0 ? (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="headline text-xl font-semibold text-ink">Participation List</h3>
            <p className="text-xs text-slate">
              Showing {visibleRows.length} of {analytics.activeRows.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate/20 text-slate">
                  <th className="px-2 py-2">Member</th>
                  <th className="px-2 py-2">Department</th>
                  <th className="px-2 py-2">Attended Event Count</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate/10">
                    <td className="px-2 py-2 font-medium text-ink">{row.name}</td>
                    <td className="px-2 py-2 text-slate">{row.department}</td>
                    <td className="px-2 py-2 text-slate">{row.attended_event_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </section>
  );
}

export default MembersPage;
