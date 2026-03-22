import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getMembers,
  getMemberById,
  createMember,
  type MemberQueryParams,
} from "../api/services/memberService";
import type { MemberCreatePayload } from "../types";

export function useMembers(params?: MemberQueryParams) {
  return useQuery({
    queryKey: ["members", params],
    queryFn: () => getMembers(params),
  });
}

export function useMember(id: number) {
  return useQuery({
    queryKey: ["member", id],
    queryFn: () => getMemberById(id),
    enabled: id > 0,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MemberCreatePayload) => createMember(payload),
    onSuccess: async () => {
      toast.success("Member created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
