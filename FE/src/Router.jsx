import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import MyApplication from "./components/MyApplication";
import SavedJobs from "./components/SavedJobs";
import Profile from "./components/Profile";
import FindJobs from "./components/FindJobs";
import Interview from "./components/Interview";
import Companies from "./components/Companies";
import Login from "./components/authComponents/Login";
import Signup from "./components/authComponents/Signup";
import VerifyEmail from "./components/authComponents/VerifyEmail";
import ProtectedRoute from "./components/authComponents/ProtectedRoute";
import CareerTips from "./components/CareerTips";
import Settings from "./components/Settings";
import LandingPage from "./components/LandingPage";
import { useAuth } from "./lib/useAuth";

/** Wraps a page so it can only be reached with a valid session. */
const guarded = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

/** Displays Dashboard for logged-in users and LandingPage for visitors. */
const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-[#5B42F3] dark:border-t-indigo-400" />
      </div>
    );
  }
  return user ? <Dashboard /> : <LandingPage />;
};

const Router = () => {
  return (
    <Routes>
      {/* Public — reachable while logged out by necessity. */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyEmail />} />

      {/* Root route adapts based on auth state */}
      <Route path="/" element={<HomeRoute />} />

      {/* Everything else requires a session. */}
      <Route path="/dashboard" element={guarded(<Dashboard />)} />
      <Route path="/applications" element={guarded(<MyApplication />)} />
      <Route path="/saved-jobs" element={guarded(<SavedJobs />)} />
      <Route path="/profile" element={guarded(<Profile />)} />
      <Route path="/find-jobs" element={guarded(<FindJobs />)} />
      <Route path="/interviews" element={guarded(<Interview />)} />
      <Route path="/companies" element={guarded(<Companies />)} />
      <Route path="/career-tips" element={guarded(<CareerTips />)} />
      <Route path="/settings" element={guarded(<Settings />)} />
    </Routes>
  );
};

export default Router;

