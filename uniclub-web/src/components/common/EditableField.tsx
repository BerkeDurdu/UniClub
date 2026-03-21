import { useState } from "react";
import toast from "react-hot-toast";
import Button from "./Button";

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (nextValue: string) => Promise<void> | void;
  placeholder?: string;
  multiline?: boolean;
}

function EditableField({
  label,
  value,
  onSave,
  placeholder = "Enter value",
  multiline = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = () => {
    setDraftValue(value);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!draftValue.trim()) {
      toast.error(`${label} cannot be empty.`);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(draftValue.trim());
      setIsEditing(false);
    } catch {
      toast.error(`Could not save ${label.toLowerCase()}.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate/20 bg-white/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
        {isEditing ? null : (
          <Button variant="ghost" className="px-3 py-1 text-xs" onClick={startEdit}>
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <>
          {multiline ? (
            <textarea
              className="w-full rounded-lg border border-slate/30 px-3 py-2 text-sm"
              rows={3}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
            />
          ) : (
            <input
              className="w-full rounded-lg border border-slate/30 px-3 py-2 text-sm"
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
            />
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" className="px-3 py-1 text-xs" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-1 text-xs"
              onClick={() => void handleSave()}
              isLoading={isSaving}
            >
              Save
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-ink">{value || placeholder}</p>
      )}
    </div>
  );
}

export default EditableField;
