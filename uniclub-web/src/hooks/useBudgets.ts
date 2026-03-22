import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getBudgetByEvent,
  createBudget,
  updateBudget,
} from "../api/services/budgetService";
import type { BudgetCreatePayload, BudgetUpdatePayload } from "../types";

export function useBudgetByEvent(eventId: number) {
  return useQuery({
    queryKey: ["budget", eventId],
    queryFn: () => getBudgetByEvent(eventId),
    enabled: eventId > 0,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BudgetCreatePayload) => createBudget(payload),
    onSuccess: async (_data, variables) => {
      toast.success("Budget created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["budget", variables.event_id] });
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: number; payload: BudgetUpdatePayload }) =>
      updateBudget(eventId, payload),
    onSuccess: async (_data, variables) => {
      toast.success("Budget updated.");
      await queryClient.invalidateQueries({ queryKey: ["budget", variables.eventId] });
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
