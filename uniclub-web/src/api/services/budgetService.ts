import { apiClient } from "../client";
import type { Budget, BudgetCreatePayload, BudgetUpdatePayload } from "../../types";

export async function getBudgetByEvent(eventId: number): Promise<Budget> {
  const response = await apiClient.get<Budget>(`/budgets/${eventId}`);
  return response.data;
}

export async function createBudget(payload: BudgetCreatePayload): Promise<Budget> {
  const response = await apiClient.post<Budget>("/budgets", payload);
  return response.data;
}

export async function updateBudget(eventId: number, payload: BudgetUpdatePayload): Promise<Budget> {
  const response = await apiClient.put<Budget>(`/budgets/${eventId}`, payload);
  return response.data;
}
