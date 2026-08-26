import axios from "axios";

export const getApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  // In dev, Vite proxies /api to the Django server (see vite.config.js).
  return "/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  // Required for the httpOnly auth cookies to be sent at all.
  withCredentials: true,
});

// Endpoints that legitimately 401 for a logged-out user. Trying to refresh
// after these would be pointless, and retrying login would loop.
const NO_REFRESH = ["/auth/login/", "/auth/register/", "/auth/refresh/", "/auth/verify/"];

// While a refresh is in flight, queue other 401s instead of firing a refresh
// per request — otherwise ten parallel calls trigger ten refreshes, and token
// rotation means all but the first would fail.
let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (
      response?.status !== 401 ||
      config?._retried ||
      NO_REFRESH.some((path) => config?.url?.includes(path))
    ) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      refreshing = refreshing ?? api.post("/auth/refresh/");
      await refreshing;
      refreshing = null;
      // Cookie has been replaced by the refresh; replay the original call.
      return api(config);
    } catch (refreshError) {
      refreshing = null;
      // Refresh token is gone or revoked — the session is genuinely over.
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
