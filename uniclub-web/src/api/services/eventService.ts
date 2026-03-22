import { apiClient } from "../client";
import type { Event, EventCreatePayload, EventUpdatePayload, EventStatus } from "../../types";

export interface EventQueryParams {
  status?: EventStatus;
  club_id?: number;
  venue_id?: number;
  upcoming_only?: boolean;
  sort_by?: "event_start" | "event_end" | "title";
  skip?: number;
  limit?: number;
}

export async function getEvents(params: EventQueryParams = {}): Promise<Event[]> {
  const response = await apiClient.get<Event[]>("/events", { params });
  return response.data;
}

export async function getEventById(id: number): Promise<Event> {
  const response = await apiClient.get<Event>(`/events/${id}`);
  return response.data;
}

export async function createEvent(payload: EventCreatePayload): Promise<Event> {
  const response = await apiClient.post<Event>("/events", payload);
  return response.data;
}

export async function updateEvent(id: number, payload: EventUpdatePayload): Promise<Event> {
  const response = await apiClient.put<Event>(`/events/${id}`, payload);
  return response.data;
}

export async function deleteEvent(id: number): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}
