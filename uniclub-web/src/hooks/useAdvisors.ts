import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getAdvisors,
  getAdvisorById,
  createAdvisor,
} from "../api/services/advisorService";
import type { AdvisorCreatePayload } from "../types";

export function useAdvisors() {
  return useQuery({
    queryKey: ["advisors"],
    queryFn: getAdvisors,
  });
}

export function useAdvisor(id: number) {
  return useQuery({
    queryKey: ["advisor", id],
    queryFn: () => getAdvisorById(id),
    enabled: id > 0,
  });
}

export function useCreateAdvisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdvisorCreatePayload) => createAdvisor(payload),
    onSuccess: async () => {
      toast.success("Advisor created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["advisors"] });
    },
  });
}
