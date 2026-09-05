import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../lib/useAuth";

const CODE_LENGTH = 6;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setUser } = useAuth();
  const inputRef = useRef(null);

  // Signup passes the address through router state so the user doesn't retype it.
  const [email] = useState(state?.email ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(state?.email ? `Verification token dispatched to ${state.email}` : "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
    else inputRef.current?.focus();
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify/", { email, code });
      setUser(data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Try again.");
      setCode("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setNotice("");
    setResending(true);
    try {
      const { data } = await api.post("/auth/resend/", { email });
      setNotice(data.message);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Rate limit exceeded. Please wait before re-requesting verification token."
          : err.response?.data?.message || "Failed to dispatch token."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex items-center justify-center px-4 transition-colors duration-150">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none overflow-hidden">
          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 text-emerald-400 font-mono text-sm font-bold mb-2.5">
                JB
              </div>
              <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Email Verification</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Input the {CODE_LENGTH}-digit cryptographic token
              </p>
            </div>

            {notice && !error && (
              <div className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 text-xs font-mono text-emerald-700 dark:text-emerald-300">
                {notice}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="code" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Verification Code
                </label>
                <input
                  ref={inputRef}
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
                  }
                  placeholder="000000"
                  required
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center text-xl tracking-[0.4em] font-mono font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
                <p className="mt-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  TOKEN EXPIRES IN 15 MINUTES
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== CODE_LENGTH}
                className="w-full rounded-md bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Validating...
                  </>
                ) : "Verify Token"}
              </button>
            </form>

            <div className="mt-5 text-center space-y-1.5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Token not received?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-60"
                >
                  {resending ? "Dispatching..." : "Resend Token"}
                </button>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Wrong address?{" "}
                <Link to="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  Register again
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;


