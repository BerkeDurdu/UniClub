import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { messageSchema, type MessageFormValues } from "../../validation/schemas";
import { getCurrentUser } from "../../api/services/authService";
import { useMessageRecipientOptions } from "../../hooks/useMessages";
import type { MessageCreatePayload } from "../../types";
import FormField from "./FormField";
import Button from "../common/Button";

interface MessageFormProps {
  onSubmit: (payload: MessageCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function MessageForm({ onSubmit, onCancel, isSubmitting }: MessageFormProps) {
  const currentUser = getCurrentUser();
  const { data: recipients = [] } = useMessageRecipientOptions();

  const defaultClubId = currentUser?.clubId ?? undefined;
  const defaultRecipientId = recipients[0]?.id;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: "",
      content: "",
      club_id: defaultClubId,
      receiver_user_id: defaultRecipientId,
    },
  });

  const selectedRecipientId = watch("receiver_user_id");

  useEffect(() => {
    if (typeof currentUser?.clubId === "number") {
      setValue("club_id", currentUser.clubId, { shouldValidate: true });
    }
  }, [currentUser?.clubId, setValue]);

  useEffect(() => {
    if (!selectedRecipientId && recipients.length > 0) {
      setValue("receiver_user_id", recipients[0].id, { shouldValidate: true });
    }
  }, [recipients, selectedRecipientId, setValue]);

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
          {typeof currentUser?.clubId === "number" ? (
            <option value={currentUser.clubId}>My Club</option>
          ) : (
            <option value="">No club assigned</option>
          )}
        </FormField>

        <FormField
          label="Recipient"
          type="select"
          error={errors.receiver_user_id}
          registration={register("receiver_user_id", { valueAsNumber: true })}
        >
          <option value="">Select recipient</option>
          {recipients.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {recipient.full_name} ({recipient.role})
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
