import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../lib/api";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.id]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register/", form);
      navigate("/verify", { replace: true, state: { email: form.email } });
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Too many sign-up attempts. Please try again later."
          : err.response?.data?.message || "Registration failed. Try again."
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
              <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
              <p className="text-xs text-slate-400 mt-1">Join Career Hub and start tracking your journey</p>
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
                <label htmlFor="username" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Full Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Anil Behera"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
                />
              </div>

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
                  <span className="ml-1 text-slate-300 font-normal">(min. 6 characters)</span>
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
                    Creating account...
                  </>
                ) : "Create Account"}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-[#4f46e5] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
