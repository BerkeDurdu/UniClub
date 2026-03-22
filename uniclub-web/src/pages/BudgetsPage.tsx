import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "../api/services/eventService";
import { useCreateBudget } from "../hooks/useBudgets";
import type { BudgetCreatePayload, Event } from "../types";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SkeletonCard from "../components/common/SkeletonCard";
import Modal from "../components/common/Modal";
import BudgetForm from "../components/forms/BudgetForm";

/**
 * BudgetsPage fetches all events and then fetches budgets for each event via
 * the report endpoint. Since the budget service only supports getBudgetByEvent(eventId),
 * we use the events list and load budgets individually. For simplicity, we use
 * the /events endpoint and a bulk approach via Promise.allSettled.
 */

import { getBudgetByEvent } from "../api/services/budgetService";

interface BudgetRow {
  eventId: number;
  eventTitle: string;
  planned_amount: number;
  actual_amount: number;
  notes: string | null;
  variance: number;
}

function BudgetsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ["events", "for-budgets"],
    queryFn: () => getEvents({ limit: 200 }),
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets", "all"],
    queryFn: async () => {
      const events: Event[] = eventsQuery.data ?? [];
      const results = await Promise.allSettled(
        events.map((event) => getBudgetByEvent(event.id))
      );
      const rows: BudgetRow[] = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "fulfilled") {
          const budget = result.value;
          rows.push({
            eventId: events[i].id,
            eventTitle: events[i].title,
            planned_amount: budget.planned_amount,
            actual_amount: budget.actual_amount,
            notes: budget.notes,
            variance: budget.planned_amount - budget.actual_amount,
          });
        }
      }
      return rows;
    },
    enabled: !!eventsQuery.data,
  });

  const createMutation = useCreateBudget();

  const rows = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data]);

  const handleCreate = async (payload: BudgetCreatePayload) => {
    await createMutation.mutateAsync(payload);
    setIsFormOpen(false);
  };

  const isLoading = eventsQuery.isLoading || budgetsQuery.isLoading;
  const isError = eventsQuery.isError;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-3xl font-bold text-ink">Budgets</h2>
          <p className="mt-1 text-slate">Track event budgets and spending.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
          Add Budget
        </Button>
      </div>

      {isError ? <ErrorMessage message="Could not load budget data." /> : null}

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!isLoading && rows.length === 0 ? (
        <EmptyState
          title="No Budgets Found"
          description="No budget records have been created yet."
        />
      ) : null}

      {rows.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate/20 text-slate">
                  <th className="px-2 py-2">Event</th>
                  <th className="px-2 py-2">Planned</th>
                  <th className="px-2 py-2">Actual</th>
                  <th className="px-2 py-2">Variance</th>
                  <th className="px-2 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.eventId} className="border-b border-slate/10">
                    <td className="px-2 py-2 font-medium text-ink">{row.eventTitle}</td>
                    <td className="px-2 py-2 text-slate">
                      ${row.planned_amount.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-slate">
                      ${row.actual_amount.toLocaleString()}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`font-semibold ${
                          row.variance >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {row.variance >= 0 ? "+" : ""}${row.variance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate">{row.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Modal title="Add Budget" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <BudgetForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </section>
  );
}

export default BudgetsPage;
