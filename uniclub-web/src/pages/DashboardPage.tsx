import { useQuery } from "@tanstack/react-query";
import Card from "../components/common/Card";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import { getClubs } from "../api/services/clubService";
import { getEvents } from "../api/services/eventService";
import { getMembers } from "../api/services/memberService";
import { getVenues } from "../api/services/venueService";

function DashboardPage() {
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
    return <ErrorMessage message="Dashboard verileri alınırken bir hata oluştu." />;
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

  return (
    <section className="space-y-6">
      <div>
        <h2 className="headline text-3xl font-bold text-ink">Dashboard</h2>
        <p className="mt-1 text-slate">UniClub ekosisteminin canlı durumunu buradan izleyin.</p>
      </div>

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
            <p className="text-sm text-slate">Yaklaşan etkinlik bulunamadi.</p>
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
