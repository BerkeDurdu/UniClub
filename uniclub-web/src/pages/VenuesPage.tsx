import { useState } from "react";
import { useVenues, useCreateVenue } from "../hooks/useVenues";
import type { VenueCreatePayload } from "../types";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import Modal from "../components/common/Modal";
import VenueForm from "../components/forms/VenueForm";

function VenuesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const venuesQuery = useVenues();
  const createMutation = useCreateVenue();

  const handleCreate = async (payload: VenueCreatePayload) => {
    await createMutation.mutateAsync(payload);
    setIsFormOpen(false);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Venues</h2>
          <p className="mt-1 text-slate">Browse and manage event venues.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
          Add Venue
        </Button>
      </div>

      {venuesQuery.isError ? <ErrorMessage message="Could not load venues." /> : null}

      {venuesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {venuesQuery.data && venuesQuery.data.length === 0 ? (
        <EmptyState
          title="No Venues Found"
          description="No venues have been created yet."
        />
      ) : null}

      {venuesQuery.data && venuesQuery.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venuesQuery.data.map((venue) => (
            <Card key={venue.id}>
              <h3 className="headline text-xl font-semibold text-ink">{venue.name}</h3>
              <p className="mt-1 text-sm text-slate">{venue.location}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-slate">
                  <span className="font-medium text-ink">Capacity:</span> {venue.capacity}
                </p>
                {venue.venue_type ? (
                  <p className="text-slate">
                    <span className="font-medium text-ink">Type:</span> {venue.venue_type}
                  </p>
                ) : null}
                {venue.description ? (
                  <p className="mt-2 text-slate">{venue.description}</p>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <Modal title="Add Venue" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <VenueForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </section>
  );
}

export default VenuesPage;
