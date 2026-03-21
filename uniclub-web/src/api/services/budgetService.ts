import { apiClient } from "../client";
import type { Budget } from "../../types";

export async function getBudgetByEvent(eventId: number): Promise<Budget> {
  const response = await apiClient.get<Budget>(`/budgets/${eventId}`);
  return response.data;
}
