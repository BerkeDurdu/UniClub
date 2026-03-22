import type { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  label: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  type?: "text" | "email" | "number" | "date" | "datetime-local" | "textarea" | "select";
  placeholder?: string;
  helperText?: string;
  children?: ReactNode; // for select options
}

function FormField({
  label,
  error,
  registration,
  type = "text",
  placeholder,
  helperText,
  children,
}: FormFieldProps) {
  const baseClass = "w-full rounded-lg border border-slate/30 px-3 py-2";

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <textarea
          className={baseClass}
          rows={3}
          placeholder={placeholder}
          {...registration}
        />
      );
    }

    if (type === "select") {
      return (
        <select className={baseClass} {...registration}>
          {children}
        </select>
      );
    }

    return (
      <input
        type={type}
        className={baseClass}
        placeholder={placeholder}
        {...registration}
      />
    );
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {renderInput()}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

export default FormField;
