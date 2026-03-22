import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClubs } from "../api/services/clubService";
import { getMembers } from "../api/services/memberService";
import { useMessages, useCreateMessage } from "../hooks/useMessages";
import type { MessageCreatePayload } from "../types";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import Modal from "../components/common/Modal";
import MessageForm from "../components/forms/MessageForm";

function MessagesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const messagesQuery = useMessages();
  const clubsQuery = useQuery({ queryKey: ["clubs"], queryFn: () => getClubs({ limit: 200 }) });
  const membersQuery = useQuery({ queryKey: ["members"], queryFn: () => getMembers({ limit: 500 }) });
  const createMutation = useCreateMessage();

  const clubMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const club of clubsQuery.data ?? []) {
      map.set(club.id, club.name);
    }
    return map;
  }, [clubsQuery.data]);

  const memberMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of membersQuery.data ?? []) {
      map.set(m.id, `${m.first_name} ${m.last_name}`);
    }
    return map;
  }, [membersQuery.data]);

  const handleCreate = async (payload: MessageCreatePayload) => {
    await createMutation.mutateAsync(payload);
    setIsFormOpen(false);
  };

  const messages = messagesQuery.data ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Messages</h2>
          <p className="mt-1 text-slate">View and send club messages.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
          Send Message
        </Button>
      </div>

      {messagesQuery.isError ? <ErrorMessage message="Could not load messages." /> : null}

      {messagesQuery.isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {messages.length === 0 && !messagesQuery.isLoading ? (
        <EmptyState
          title="No Messages Found"
          description="No messages have been sent yet."
        />
      ) : null}

      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="headline text-lg font-semibold text-ink">{msg.subject}</h3>
                  <p className="mt-1 text-sm text-slate line-clamp-2">{msg.content}</p>
                </div>
                <p className="shrink-0 text-xs text-slate">
                  {new Date(msg.sent_at).toLocaleString()}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate">
                <span>Club: {clubMap.get(msg.club_id) ?? `#${msg.club_id}`}</span>
                <span>From: {memberMap.get(msg.member_id) ?? `Member #${msg.member_id}`}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <Modal title="Send Message" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <MessageForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </section>
  );
}

export default MessagesPage;
