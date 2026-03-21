import { useState } from "react";
import toast from "react-hot-toast";
import Button from "./Button";

interface AddItemBoxProps {
  title: string;
  placeholder: string;
  buttonLabel?: string;
  onAdd: (value: string) => Promise<void> | void;
  validate?: (value: string) => string | null;
}

function AddItemBox({
  title,
  placeholder,
  buttonLabel = "Add",
  onAdd,
  validate,
}: AddItemBoxProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Please enter a value.");
      return;
    }

    const validationMessage = validate ? validate(trimmed) : null;
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd(trimmed);
      setValue("");
    } catch {
      toast.error("Could not add item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-slate/40 bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">{title}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="w-full rounded-lg border border-slate/30 px-3 py-2 text-sm"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button
          variant="secondary"
          className="sm:w-auto"
          isLoading={isSubmitting}
          onClick={() => void submit()}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

export default AddItemBox;
