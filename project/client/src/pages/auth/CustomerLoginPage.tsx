import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.user.role !== "CUSTOMER") {
        setError("This login is for customers only. Use the correct login page.");
        return;
      }
      login(res.data.token, res.data.user);
      navigate("/customer/home");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-[1.3fr,1fr] gap-6 items-stretch rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-slate-50 shadow-[0_18px_40px_rgba(15,23,42,0.08)] p-6 md:p-8">
      <div className="flex flex-col justify-center space-y-3 pr-0 md:pr-4">
        <h1 className="text-2xl font-semibold text-slate-900">Customer sign in</h1>
        <p className="text-sm text-slate-600 max-w-md">
          Sign in to Connext to create new service requests, track your providers in real time, and
          view past jobs.
        </p>
        <ul className="mt-1 space-y-1 text-xs text-slate-600">
          <li>• See nearby Service Providers available in your area.</li>
          <li>• Follow each job from request to completion.</li>
          <li>• Rebook trusted professionals in a few taps.</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm shadow-slate-900/10">
        <h2 className="text-lg font-semibold mb-1 text-slate-900">Login as Customer</h2>
        <p className="text-xs text-slate-500 mb-4">Use your email and password to continue.</p>
        {error && <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          <div>
            <label htmlFor="customer_email" className="block mb-1 text-slate-700">
              Email
            </label>
            <input
              id="customer_email"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="customer_password" className="block mb-1 text-slate-700">
              Password
            </label>
            <input
              id="customer_password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-sky-500 text-slate-950 rounded-xl py-2.5 text-sm font-semibold hover:bg-sky-400 shadow-sm shadow-sky-900/30 transition-colors"
          >
            Login as Customer
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-600">
          New customer?{" "}
          <Link to="/customer/register" className="text-sky-600 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
