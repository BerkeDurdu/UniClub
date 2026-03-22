import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getAllMessages,
  getMessagesByClub,
  createMessage,
  getMessageRecipientOptions,
} from "../api/services/messageService";
import type { MessageCreatePayload } from "../types";

export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: getAllMessages,
  });
}

export function useMessagesByClub(clubId: number) {
  return useQuery({
    queryKey: ["messages", "club", clubId],
    queryFn: () => getMessagesByClub(clubId),
    enabled: clubId > 0,
  });
}

export function useMessageRecipientOptions() {
  return useQuery({
    queryKey: ["messages", "recipient-options"],
    queryFn: getMessageRecipientOptions,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MessageCreatePayload) => createMessage(payload),
    onSuccess: async () => {
      toast.success("Message sent successfully.");
      await queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}
