import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { notify } from "../util/notify";

const AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

function getCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

// REQUEST
AxiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers ?? {};

  const token = getCookie("XSRF-TOKEN");
  if (token) config.headers["X-XSRF-TOKEN"] = token;

  config.headers["X-Requested-With"] = "XMLHttpRequest";
  config.headers["Accept"] = "application/json";

  if (!(config.data instanceof FormData) && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// RESPONSE (ONLY GLOBAL ERRORS)
AxiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    const isAuthCheck = url.includes("/user/auth/me");
    const isLoginAttempt = url.includes("auth/login");

    if (status === 401 && !isAuthCheck && !isLoginAttempt) {
      notify.error("Session expired. Please log in again.");
    }

    if (status === 403) {
      notify.error("Access denied.");
    }

    if (typeof status === "number" && status >= 500) {
      notify.error("Server error. Try again later.");
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;