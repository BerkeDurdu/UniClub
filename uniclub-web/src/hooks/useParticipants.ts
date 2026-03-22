import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getEventParticipants,
  createParticipant,
} from "../api/services/participantService";
import type { ParticipantCreatePayload } from "../types";

export function useEventParticipants(eventId: number) {
  return useQuery({
    queryKey: ["participants", eventId],
    queryFn: () => getEventParticipants(eventId),
    enabled: eventId > 0,
  });
}

export function useCreateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ParticipantCreatePayload) => createParticipant(payload),
    onSuccess: async (_data, variables) => {
      toast.success("Participant added.");
      await queryClient.invalidateQueries({
        queryKey: ["participants", variables.event_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["event-participants", variables.event_id],
      });
    },
  });
}
