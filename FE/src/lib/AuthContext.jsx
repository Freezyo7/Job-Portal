import { useCallback, useEffect, useMemo, useState } from "react";
import api from "./api";
import { AuthContext } from "./authContextObject";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Starts true so guarded routes wait for the session check instead of
  // bouncing a logged-in user to /login on every page load.
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me/");
      setUser(data);
      return data;
    } catch {
      // A 401 here is ambiguous: either nobody is logged in, or the access
      // token expired (60m) while the refresh cookie is still good (7d). The
      // interceptor deliberately skips /auth/me/, so try the refresh once
      // ourselves. If there is no refresh cookie this 401s and we settle on
      // logged-out — without the interceptor's redirect to /login, which would
      // otherwise eject visitors browsing public pages.
      try {
        await api.post("/auth/refresh/");
        const { data } = await api.get("/auth/me/");
        setUser(data);
        return data;
      } catch {
        setUser(null);
        return null;
      }
    }
  }, []);

  useEffect(() => {
    // The auth cookie is httpOnly, so JS can't read it — asking the server
    // is the only way to know whether we're logged in.
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login/", { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout/");
    } finally {
      // Clear locally even if the request failed — the user asked to leave.
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, setUser }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
