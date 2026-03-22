import type { AxiosError } from "axios";

interface ValidationDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ValidationErrorResponse {
  detail: ValidationDetail[];
}

/**
 * Parse FastAPI 422 validation errors into a field-name -> message map.
 */
export function parseValidationErrors(
  error: unknown
): Record<string, string> {
  const result: Record<string, string> = {};

  if (!isApiError(error)) return result;

  const axiosError = error as AxiosError<ValidationErrorResponse>;
  const detail = axiosError.response?.data?.detail;

  if (!Array.isArray(detail)) return result;

  for (const item of detail) {
    // loc is typically ["body", "field_name"] – take the last element
    const fieldName = item.loc[item.loc.length - 1];
    if (typeof fieldName === "string") {
      result[fieldName] = item.msg;
    }
  }

  return result;
}

/**
 * Type guard: returns true when the value looks like an Axios error with a response.
 */
export function isApiError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as Record<string, unknown>;
  return "isAxiosError" in err && err.isAxiosError === true;
}

/**
 * Extract a user-friendly error message from any error type.
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const axiosError = error as AxiosError<{ detail?: string | ValidationDetail[] }>;
    const detail = axiosError.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d) => d.msg).join(", ");
    }
    return axiosError.message ?? "An unexpected error occurred.";
  }

  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred.";
}
