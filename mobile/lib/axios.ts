import axios from "axios";
import * as Sentry from "@sentry/react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

console.log("API URL:", API_URL);

// this is the same thing we did with useEffect setup but it's optimized version - it's better!!

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 second timeout to prevent hanging requests
});

// Response interceptor registered once
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      Sentry.logger.error(
        Sentry.logger.fmt`API request timed out: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        { endpoint: error.config?.url, method: error.config?.method }
      );
      console.error("API Request Timed Out:", error.config?.url);
    } else if (error.response) {
      Sentry.logger.error(
        Sentry.logger
          .fmt`API request failed: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        { status: error.response.status, endpoint: error.config?.url, method: error.config?.method }
      );
    } else if (error.request) {
      Sentry.logger.error("API request failed - no response received", {
        endpoint: error.config?.url,
        method: error.config?.method,
        baseURL: API_URL,
        error: error.message,
        code: error.code,
      });
      console.error("Network Error - Full Details:", {
        message: error.message,
        code: error.code,
        baseURL: API_URL,
        url: error.config?.url,
        fullError: error,
      });
    }
    return Promise.reject(error);
  }
);

export const useApi = () => {
  const { getToken } = useAuth();

  const apiWithAuth = useCallback(
    async <T>(config: Parameters<typeof api.request>[0]) => {
      const token = await getToken();
      return api.request<T>({
        ...config,
        headers: { ...config.headers, ...(token && { Authorization: `Bearer ${token}` }) },
      });
    },
    [getToken]
  );

  return { api, apiWithAuth };
};
