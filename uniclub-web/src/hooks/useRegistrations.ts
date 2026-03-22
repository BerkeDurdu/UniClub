import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getRegistrations,
  registerForEvent,
  type RegistrationPayload,
} from "../api/services/registrationService";

export function useRegistrations(eventId?: number) {
  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => getRegistrations(eventId),
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegistrationPayload) => registerForEvent(payload),
    onSuccess: async (_data, variables) => {
      toast.success("Registration successful.");
      await queryClient.invalidateQueries({ queryKey: ["registrations"] });
      await queryClient.invalidateQueries({
        queryKey: ["event-registrations", variables.event_id],
      });
    },
  });
}
