import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  console.error("VITE_API_URL environment variable is not set");
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;
