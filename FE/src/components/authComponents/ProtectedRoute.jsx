import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/useAuth";

/** Gates a route behind a valid session, remembering where the user was headed. */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for the initial /auth/me check, or a logged-in user would be
  // redirected to /login on every refresh.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#4f46e5]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
