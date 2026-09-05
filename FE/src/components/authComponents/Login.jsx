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
      navigate(state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Try again.";
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
    <div
      className="min-h-screen flex items-center justify-center px-4 transition-colors duration-150"
      style={{
        backgroundColor: "var(--nt-bg-primary)",
        color: "var(--nt-text-primary)",
      }}
    >
      <div className="w-full max-w-sm">

        {/* Card */}
        <div
          className="rounded-lg border shadow-none overflow-hidden"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-md)",
          }}
        >
          <div className="p-6">
            {/* Logo / title */}
            <div className="mb-6 text-center">
              <div
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border font-mono text-sm font-bold mb-2.5"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-accent-sage)",
                }}
              >
                JB
              </div>
              <h1 className="text-base font-semibold tracking-tight" style={{ color: "var(--nt-text-primary)" }}>Authentication</h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>Sign in to access telemetry workspace</p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 rounded-md border px-3 py-2 text-xs"
                style={{
                  backgroundColor: "rgba(217, 83, 79, 0.12)",
                  borderColor: "rgba(217, 83, 79, 0.3)",
                  color: "#D9534F",
                }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--nt-text-secondary)" }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="dev@example.com"
                  required
                  className="w-full px-3 py-2 rounded-md border text-xs font-mono focus:outline-none"
                  style={{
                    backgroundColor: "var(--nt-bg-card-alt)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-primary)",
                  }}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--nt-text-secondary)" }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 rounded-md border text-xs font-mono focus:outline-none"
                  style={{
                    backgroundColor: "var(--nt-bg-card-alt)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-primary)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md py-2 text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--nt-accent-gold)",
                  color: "var(--nt-btn-cta-text)",
                }}
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
              <div className="h-px flex-1" style={{ backgroundColor: "var(--nt-border)" }} />
              <span className="text-[11px] font-mono uppercase" style={{ color: "var(--nt-text-muted)" }}>or</span>
              <div className="h-px flex-1" style={{ backgroundColor: "var(--nt-border)" }} />
            </div>
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={() => setError("Google sign-in failed. Try again.")}
            />

            {/* Footer */}
            <p className="mt-5 text-center text-xs" style={{ color: "var(--nt-text-secondary)" }}>
              No account registered?{" "}
              <Link to="/signup" className="font-semibold hover:underline" style={{ color: "var(--nt-accent-sage)" }}>
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
