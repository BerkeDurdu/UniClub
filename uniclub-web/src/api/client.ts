import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;
    const detail = error?.response?.data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";

    if (status && [400, 404, 409, 422].includes(status)) {
      toast.error(message);
    }

    console.error("API error:", error);
    return Promise.reject(error);
  }
);
