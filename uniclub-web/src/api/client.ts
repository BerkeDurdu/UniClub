import axios from "axios";
import toast from "react-hot-toast";

const FALLBACK_API_BASE_URL = "http://127.0.0.1:8010";
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// If a stale dev session is still pointing to 8000 (currently unhealthy),
// transparently route requests to the healthy backend on 8010.
const API_BASE_URL =
  rawApiBaseUrl === "http://127.0.0.1:8000"
    ? FALLBACK_API_BASE_URL
    : (rawApiBaseUrl ?? FALLBACK_API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;
    const detail = error?.response?.data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : "An unexpected error occurred. Please try again.";

    if (status && [400, 403, 404, 409, 422].includes(status)) {
      toast.error(message);
    } else if (status && status >= 500) {
      toast.error("A server error occurred. Please try again later.");
    }

    console.error("API error:", error);
    return Promise.reject(error);
  }
);
