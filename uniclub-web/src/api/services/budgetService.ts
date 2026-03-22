import { apiClient } from "../client";
import type { Budget, BudgetCreatePayload, BudgetUpdatePayload } from "../../types";

export async function getBudgetByEvent(eventId: number): Promise<Budget> {
  const response = await apiClient.get<Budget>(`/budgets/${eventId}`);
  return response.data;
}

export async function getBudgetByEventOptional(eventId: number): Promise<Budget | null> {
  const response = await apiClient.get<Budget | { detail: string }>(`/budgets/${eventId}`, {
    validateStatus: (status) => status === 200 || status === 404,
  });
  if (response.status === 404) {
    return null;
  }
  return response.data as Budget;
}

export async function createBudget(payload: BudgetCreatePayload): Promise<Budget> {
  const response = await apiClient.post<Budget>("/budgets", payload);
  return response.data;
}

export async function updateBudget(eventId: number, payload: BudgetUpdatePayload): Promise<Budget> {
  const response = await apiClient.put<Budget>(`/budgets/${eventId}`, payload);
  return response.data;
}
