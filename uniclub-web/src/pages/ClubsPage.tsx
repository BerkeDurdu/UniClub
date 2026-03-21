import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createClub, getClubs } from "../api/services/clubService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import ClubForm from "../components/forms/ClubForm";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { ClubCreatePayload } from "../types";

const PAGE_SIZE = 6;

function ClubsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const queryClient = useQueryClient();

  const clubsQuery = useQuery({
    queryKey: ["clubs", debouncedSearch, category, page],
    queryFn: () =>
      getClubs({
        search: debouncedSearch || undefined,
        category: category || undefined,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
  });

  const createClubMutation = useMutation({
    mutationFn: (payload: ClubCreatePayload) => createClub(payload),
    onSuccess: async () => {
      toast.success("Club created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["clubs"] });
      setIsFormOpen(false);
    },
  });

  const categories = useMemo(
    () => ["", "Academic", "Arts", "Sports", "Community", "Technology"],
    []
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Clubs</h2>
          <p className="mt-1 text-slate">Kulup listesi, arama, filtreleme ve olusturma.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
          Create Club
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(0);
            }}
            placeholder="Search clubs"
            className="rounded-lg border border-slate/30 px-3 py-2"
          />
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-slate/30 px-3 py-2"
          >
            {categories.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "All categories"}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              disabled={(clubsQuery.data ?? []).length < PAGE_SIZE}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {clubsQuery.isError ? <ErrorMessage message="Kulup verileri alınamadı." /> : null}

      {clubsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {clubsQuery.data && clubsQuery.data.length === 0 ? (
        <EmptyState
          title="No Results Found"
          description="Aradiginiz filtreye uygun kulup bulunamadi. Arama ifadesini veya kategori secimini degistirin."
        />
      ) : null}

      {clubsQuery.data && clubsQuery.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubsQuery.data.map((club) => (
            <Card key={club.id}>
              <h3 className="headline text-xl font-semibold text-ink">{club.name}</h3>
              <p className="mt-1 text-sm text-slate">Category: {club.category}</p>
              <p className="mt-3 text-sm text-slate">{club.description}</p>
              <Link className="mt-4 inline-block text-sm font-semibold text-ink underline" to={`/clubs/${club.id}`}>
                View details
              </Link>
            </Card>
          ))}
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="headline mb-4 text-2xl font-semibold text-ink">Create Club</h3>
            <ClubForm
              onSubmit={async (payload) => {
                await createClubMutation.mutateAsync(payload);
              }}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={createClubMutation.isPending}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ClubsPage;
