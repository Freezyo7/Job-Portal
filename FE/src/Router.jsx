import React from "react";
import { Routes, Route } from "react-router-dom";
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

/** Wraps a page so it can only be reached with a valid session. */
const guarded = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

const Router = () => {
  return (
    <Routes>
      {/* Public — reachable while logged out by necessity. */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyEmail />} />

      {/* Everything else requires a session. */}
      <Route path="/" element={guarded(<Dashboard />)} />
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
