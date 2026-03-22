import { useQuery } from "@tanstack/react-query";
import Card from "../components/common/Card";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import { apiClient } from "../api/client";
import { getClubs } from "../api/services/clubService";
import { getEvents } from "../api/services/eventService";
import { getMembers } from "../api/services/memberService";
import { getVenues } from "../api/services/venueService";

interface HealthResponse {
  status: string;
  app_version?: string;
  environment?: string;
}

interface DbHealthResponse {
  status: string;
  database?: string;
  message?: string;
}

function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await apiClient.get<HealthResponse>("/health");
      return response.data;
    },
    retry: false,
  });

  const dbHealthQuery = useQuery({
    queryKey: ["health", "db"],
    queryFn: async () => {
      const response = await apiClient.get<DbHealthResponse>("/health/db");
      return response.data;
    },
    retry: false,
  });

  const clubsQuery = useQuery({ queryKey: ["dashboard", "clubs"], queryFn: () => getClubs({ limit: 500 }) });
  const eventsQuery = useQuery({ queryKey: ["dashboard", "events"], queryFn: () => getEvents({ limit: 500 }) });
  const membersQuery = useQuery({ queryKey: ["dashboard", "members"], queryFn: () => getMembers({ limit: 500 }) });
  const venuesQuery = useQuery({ queryKey: ["dashboard", "venues"], queryFn: getVenues });

  const isLoading =
    clubsQuery.isLoading ||
    eventsQuery.isLoading ||
    membersQuery.isLoading ||
    venuesQuery.isLoading;

  const hasError =
    clubsQuery.isError ||
    eventsQuery.isError ||
    membersQuery.isError ||
    venuesQuery.isError;

  if (hasError) {
    return <ErrorMessage message="An error occurred while loading dashboard data." />;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const clubs = clubsQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const venues = venuesQuery.data ?? [];

  const upcomingEvents = events.filter(
    (event) => new Date(event.event_start) > new Date() && event.status === "Scheduled"
  );

  const capacityRatios = upcomingEvents.slice(0, 4).map((event) => {
    const venue = venues.find((item) => item.id === event.venue_id);
    const safeCapacity = venue ? Math.max(venue.capacity, 1) : 1;
    const utilization = Math.min(100, Math.round((members.length / safeCapacity) * 100));

    return {
      id: event.id,
      title: event.title,
      utilization,
    };
  });

  const apiConnected = healthQuery.isSuccess && healthQuery.data?.status === "ok";
  const dbConnected = dbHealthQuery.isSuccess && dbHealthQuery.data?.status === "ok";

  return (
    <section className="space-y-6">
      <div>
        <h2 className="headline text-3xl font-bold text-ink">Dashboard</h2>
        <p className="mt-1 text-slate">Track the live status of the UniClub ecosystem.</p>
      </div>

      <Card>
        <h3 className="headline text-lg font-semibold text-ink">Backend Status</h3>
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${apiConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-slate">
              API: {healthQuery.isLoading ? "checking..." : apiConnected ? "connected" : "disconnected"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${dbConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-slate">
              Database: {dbHealthQuery.isLoading ? "checking..." : dbConnected ? "connected" : "disconnected"}
            </span>
          </div>
          {healthQuery.isSuccess && healthQuery.data?.app_version ? (
            <span className="text-sm text-slate">v{healthQuery.data.app_version}</span>
          ) : null}
        </div>
        {healthQuery.isError ? (
          <p className="mt-2 text-sm text-red-600">
            Backend is unreachable. Make sure the API server is running.
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-slate">Total Active Clubs</p>
          <p className="headline mt-2 text-3xl font-semibold">{clubs.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate">Upcoming Events Count</p>
          <p className="headline mt-2 text-3xl font-semibold">{upcomingEvents.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate">Total Registered Members</p>
          <p className="headline mt-2 text-3xl font-semibold">{members.length}</p>
        </Card>
      </div>

      <Card>
        <h3 className="headline text-lg font-semibold text-ink">Event Capacity Pulse</h3>
        <div className="mt-4 space-y-3">
          {capacityRatios.length === 0 ? (
            <p className="text-sm text-slate">No upcoming events were found.</p>
          ) : (
            capacityRatios.map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{item.title}</span>
                  <span>{item.utilization}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#DFE6EF]">
                  <div
                    className="h-full rounded-full bg-signal transition-all"
                    style={{ width: `${item.utilization}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}

export default DashboardPage;
