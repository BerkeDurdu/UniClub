import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getClubLocalProfile, upsertClubLocalProfile } from "../api/services/clubProfileService";
import { createClub, getClubs } from "../api/services/clubService";
import Button from "../components/common/Button";
import AddItemBox from "../components/common/AddItemBox";
import Card from "../components/common/Card";
import EditableField from "../components/common/EditableField";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import ClubForm, { type ClubFormSubmitPayload } from "../components/forms/ClubForm";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { ClubCreatePayload } from "../types";

const PAGE_SIZE = 6;

function ClubsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [profileRevision, setProfileRevision] = useState(0);
  const [localCategoryTags, setLocalCategoryTags] = useState<string[]>([]);
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

  const handleCreateClub = async (payload: ClubFormSubmitPayload) => {
    const created = await createClubMutation.mutateAsync(payload.createPayload);

    // TODO: Move these profile fields to backend once club schema supports them.
    upsertClubLocalProfile(created.id, {
      ...payload.localProfile,
      category: payload.createPayload.category,
      description: payload.createPayload.description,
      founded_date: payload.createPayload.founded_date,
    });
    setProfileRevision((prev) => prev + 1);
  };

  const categories = useMemo(
    () => ["", "Academic", "Arts", "Sports", "Community", "Technology"],
    []
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Clubs</h2>
          <p className="mt-1 text-slate">Browse, filter, and create clubs in one place.</p>
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

      {clubsQuery.isError ? <ErrorMessage message="Could not load club data." /> : null}

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
          description="No clubs matched your filters. Try another search query or category."
        />
      ) : null}

      <AddItemBox
        title="Quick Category Tag"
        placeholder="Enter a category tag"
        buttonLabel="Add Tag"
        validate={(value) =>
          localCategoryTags.some((item) => item.toLowerCase() === value.toLowerCase())
            ? "This tag already exists."
            : null
        }
        onAdd={async (value) => {
          setLocalCategoryTags((prev) => [...prev, value]);
          toast.success("Category tag added.");
        }}
      />

      {localCategoryTags.length > 0 ? (
        <Card>
          <p className="text-sm text-slate">Local category tags:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {localCategoryTags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#EAF0F8] px-3 py-1 text-xs font-semibold text-ink">
                {tag}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {clubsQuery.data && clubsQuery.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubsQuery.data.map((club) => (
            <Card key={`${club.id}-${profileRevision}`}>
              <h3 className="headline text-xl font-semibold text-ink">{club.name}</h3>
              <p className="mt-1 text-sm text-slate">
                Founded: {new Date(club.founded_date).toLocaleDateString()}
              </p>
              <div className="mt-3 space-y-2">
                <EditableField
                  label="Category"
                  value={getClubLocalProfile(club.id).category ?? club.category}
                  onSave={async (nextValue) => {
                    upsertClubLocalProfile(club.id, { category: nextValue });
                    setProfileRevision((prev) => prev + 1);
                    toast.success("Category updated locally.");
                  }}
                />
                <EditableField
                  label="Description"
                  multiline
                  value={getClubLocalProfile(club.id).description ?? club.description}
                  onSave={async (nextValue) => {
                    upsertClubLocalProfile(club.id, { description: nextValue });
                    setProfileRevision((prev) => prev + 1);
                    toast.success("Description updated locally.");
                  }}
                />
              </div>
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
              onSubmit={handleCreateClub}
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
