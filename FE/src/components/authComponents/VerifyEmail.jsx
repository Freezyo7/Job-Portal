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
  const [notice, setNotice] = useState(state?.email ? `We sent a code to ${state.email}` : "");
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
      // Verifying also logs the user in, so go straight to the dashboard.
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
          ? "Too many requests. Please wait before requesting another code."
          : err.response?.data?.message || "Could not resend the code."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border-2 border-slate-200/80 bg-white/70 backdrop-blur-sm shadow-2xl shadow-slate-300/50 overflow-hidden">
          <div className="h-1.5 w-full bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]" />

          <div className="px-8 py-8">
            <div className="mb-7 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] mb-3">
                <span className="text-xl font-bold text-[#4f46e5]">C</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Verify your email</h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter the {CODE_LENGTH}-digit code we sent you
              </p>
            </div>

            {notice && !error && (
              <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-xs text-emerald-700">
                {notice}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Verification code
                </label>
                <input
                  ref={inputRef}
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  // Strip non-digits so pasting "482 913" still works.
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
                  }
                  placeholder="000000"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-center text-2xl tracking-[0.5em] font-semibold text-slate-800 placeholder:text-slate-200 placeholder:tracking-[0.5em] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  The code expires in 15 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== CODE_LENGTH}
                className="w-full rounded-2xl bg-[#4f46e5] py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Verifying...
                  </>
                ) : "Verify email"}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-slate-400">
                Didn't get it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium text-[#4f46e5] hover:underline disabled:opacity-60"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </p>
              <p className="text-xs text-slate-400">
                Wrong address?{" "}
                <Link to="/signup" className="font-medium text-[#4f46e5] hover:underline">
                  Sign up again
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
