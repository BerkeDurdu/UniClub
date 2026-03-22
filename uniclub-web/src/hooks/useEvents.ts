import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  type EventQueryParams,
} from "../api/services/eventService";
import type { EventCreatePayload, EventUpdatePayload } from "../types";

export function useEvents(params?: EventQueryParams) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => getEvents(params),
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id),
    enabled: id > 0,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventCreatePayload) => createEvent(payload),
    onSuccess: async () => {
      toast.success("Event created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EventUpdatePayload }) =>
      updateEvent(id, payload),
    onSuccess: async (_data, variables) => {
      toast.success("Event updated.");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["event", variables.id] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: async () => {
      toast.success("Event deleted.");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
