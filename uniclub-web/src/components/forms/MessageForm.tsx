import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { messageSchema, type MessageFormValues } from "../../validation/schemas";
import { getClubs } from "../../api/services/clubService";
import { getMembers } from "../../api/services/memberService";
import type { MessageCreatePayload } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface MessageFormProps {
  onSubmit: (payload: MessageCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function MessageForm({ onSubmit, onCancel, isSubmitting }: MessageFormProps) {
  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => getClubs(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => getMembers(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: "",
      content: "",
      club_id: clubs[0]?.id,
      member_id: members[0]?.id,
    },
  });

  const submit = async (values: MessageFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <FormField
        label="Subject"
        error={errors.subject}
        registration={register("subject")}
      />

      <FormField
        label="Content"
        type="textarea"
        error={errors.content}
        registration={register("content")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Club"
          type="select"
          error={errors.club_id}
          registration={register("club_id", { valueAsNumber: true })}
        >
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </FormField>

        <FormField
          label="Member"
          type="select"
          error={errors.member_id}
          registration={register("member_id", { valueAsNumber: true })}
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.first_name} {member.last_name}
            </option>
          ))}
        </FormField>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          Send Message
        </Button>
      </div>
    </form>
  );
}

export default MessageForm;
