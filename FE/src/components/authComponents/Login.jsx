import React, { useCallback, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/useAuth";
import GoogleSignInButton from "./GoogleSignInButton";

const Login = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm]       = useState({ email: state?.email ?? "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.id]: e.target.value }));

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setError("");
      try {
        await loginWithGoogle(credential);
        navigate(state?.from?.pathname ?? "/", { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || "Google sign-in failed. Try again.");
      }
    },
    [loginWithGoogle, navigate, state]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      // Return the user to whatever page sent them here, if any.
      navigate(state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Try again.";
      // An unverified account can finish signing up instead of being stuck.
      if (message.toLowerCase().includes("verify")) {
        navigate("/verify", { state: { email: form.email } });
        return;
      }
      setError(
        err.response?.status === 429
          ? "Too many login attempts. Please try again later."
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-3xl border-2 border-slate-200/80 bg-white/70 backdrop-blur-sm shadow-2xl shadow-slate-300/50 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1.5 w-full bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]" />

          <div className="px-8 py-8">
            {/* Logo / title */}
            <div className="mb-7 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] mb-3">
                <span className="text-xl font-bold text-[#4f46e5]">C</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
              <p className="text-xs text-slate-400 mt-1">Sign in to your Career Hub account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#4f46e5] py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : "Sign In"}
              </button>
            </form>

            {/* Google sign-in */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={() => setError("Google sign-in failed. Try again.")}
            />

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-slate-400">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-[#4f46e5] hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
