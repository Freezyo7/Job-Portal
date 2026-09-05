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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex items-center justify-center px-4 transition-colors duration-150">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none overflow-hidden">
          <div className="p-6">
            {/* Logo / title */}
            <div className="mb-6 text-center">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 text-emerald-400 font-mono text-sm font-bold mb-2.5">
                JB
              </div>
              <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Authentication</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Sign in to access telemetry workspace</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="dev@example.com"
                  required
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Authenticating...
                  </>
                ) : "Sign In"}
              </button>
            </form>

            {/* Google sign-in */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200 dark:border-zinc-800" />
              <span className="text-[11px] font-mono uppercase text-zinc-400">or</span>
              <div className="h-px flex-1 bg-zinc-200 dark:border-zinc-800" />
            </div>
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={() => setError("Google sign-in failed. Try again.")}
            />

            {/* Footer */}
            <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No account registered?{" "}
              <Link to="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


