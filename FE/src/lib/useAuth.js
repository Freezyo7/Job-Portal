import { useContext } from "react";
import { AuthContext } from "./authContextObject";

/** Access the current session. Must be called inside <AuthProvider>. */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
};
