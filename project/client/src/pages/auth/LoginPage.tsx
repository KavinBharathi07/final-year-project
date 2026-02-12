import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export function LoginPage() {
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
      login(res.data.token, res.data.user);
      if (res.data.user.role === "PROVIDER") navigate("/provider/dashboard");
      else if (res.data.user.role === "ADMIN") navigate("/admin/providers");
      else navigate("/customer/new-request");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-[1.3fr,1fr] gap-6 items-stretch rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-slate-50 shadow-[0_18px_40px_rgba(15,23,42,0.08)] p-6 md:p-8">
      <div className="flex flex-col justify-center space-y-3 pr-0 md:pr-4">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to Connext</h1>
        <p className="text-sm text-slate-600 max-w-md">
          Use your account to continue as a Customer, Service Provider, or Admin. We&apos;ll route
          you to the right dashboard automatically.
        </p>
        <ul className="mt-1 space-y-1 text-xs text-slate-600">
          <li>• One login for all roles you have access to.</li>
          <li>• Secure access with JWT-based authentication.</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm shadow-slate-900/10">
        <h2 className="text-lg font-semibold mb-1 text-slate-900">Login</h2>
        <p className="text-xs text-slate-500 mb-4">Enter your email and password to continue.</p>
        {error && <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block mb-1 text-slate-700">Email</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-slate-700">Password</label>
            <input
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
            Login
          </button>
        </form>
        <div className="mt-4 text-xs text-slate-600">
          New customer?{" "}
          <button
            type="button"
            onClick={() => navigate("/customer/register")}
            className="text-sky-600 underline"
          >
            Create a customer account
          </button>
        </div>
      </div>
    </div>
  );
}

