import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { CustomerNewRequest } from "./pages/customer/CustomerNewRequest";
import { CustomerHomePage } from "./pages/customer/CustomerHomePage";
import { CustomerRequestTracking } from "./pages/customer/CustomerRequestTracking";
import { ProviderRegister } from "./pages/provider/ProviderRegister";
import { ProviderDashboard } from "./pages/provider/ProviderDashboard";
import { ProviderRequestPage } from "./pages/provider/ProviderRequestPage";
import { AdminProvidersPage } from "./pages/admin/AdminProvidersPage";
import { AdminRequestsPage } from "./pages/admin/AdminRequestsPage";
import { LoginChoicePage } from "./pages/auth/LoginChoicePage";
import { CustomerLoginPage } from "./pages/auth/CustomerLoginPage";
import { ProviderLoginPage } from "./pages/auth/ProviderLoginPage";
import { AdminLoginPage } from "./pages/auth/AdminLoginPage";
import { CustomerRegisterPage } from "./pages/auth/CustomerRegisterPage";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const adminTarget = user?.role === "ADMIN" ? "/admin/providers" : "/login/admin";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-900/10 bg-gradient-to-r from-slate-950 via-sky-950 to-sky-800 shadow-lg shadow-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-2xl bg-sky-400/90 backdrop-blur-sm flex items-center justify-center shadow-md shadow-black/40">
              <span className="text-lg font-black text-slate-950 group-hover:text-slate-900 transition-colors">
                CX
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm tracking-wide uppercase text-slate-50">
                Connext
              </span>
              <span className="text-[11px] text-slate-300">
                Smart home service network
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-3 text-xs sm:text-sm">
            <Link
              to="/customer/new-request"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-50 border border-white/20 transition-colors"
            >
              Customer
            </Link>
            <Link
              to="/provider/dashboard"
              className="px-3 py-1.5 rounded-full bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold shadow-sm shadow-sky-900/60 transition-colors"
            >
              Service Provider
            </Link>
            <Link
              to={adminTarget}
              className="px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium shadow-sm shadow-amber-900/40 transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-10">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.08),_transparent_55%)]" />
          <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_18px_60px_rgba(15,23,42,0.18)] overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginChoicePage />} />
              <Route path="/login/customer" element={<CustomerLoginPage />} />
              <Route path="/login/provider" element={<ProviderLoginPage />} />
              <Route path="/login/admin" element={<AdminLoginPage />} />
              <Route path="/customer/register" element={<CustomerRegisterPage />} />

              <Route path="/customer/home" element={<CustomerHomePage />} />
              <Route path="/customer/new-request" element={<CustomerNewRequest />} />
              <Route path="/customer/request/:id" element={<CustomerRequestTracking />} />

              <Route path="/provider/register" element={<ProviderRegister />} />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/provider/request/:id" element={<ProviderRequestPage />} />

              <Route path="/admin/providers" element={<AdminProvidersPage />} />
              <Route path="/admin/requests" element={<AdminRequestsPage />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

