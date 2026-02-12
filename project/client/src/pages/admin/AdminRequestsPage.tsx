import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export function AdminRequestsPage() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    if (!user || user.role !== "ADMIN") return;
    setLoadError(null);
    setLoading(true);
    try {
      const res = await api.get("/admin/requests");
      setRequests(res.data.requests || []);
    } catch (err: any) {
      const msg = err.response?.status === 403
        ? "Access denied. Log out and log in again as Admin."
        : err.response?.data?.message || "Failed to load requests.";
      setLoadError(msg);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user?.id, token]);

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login/admin" replace />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Service Requests</h1>
        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      {loadError && (
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
          {loadError}
        </div>
      )}
      <div className="bg-white rounded-lg shadow divide-y text-sm">
        {requests.map((r) => (
          <div key={r._id} className="p-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{r.category}</div>
              <div className="text-xs text-slate-600">{r.description}</div>
              <div className="text-xs text-slate-600 mt-1">
                Customer: {r.customerId?.name} ({r.customerId?.email})
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Provider:{" "}
                {r.assignedProviderId
                  ? r.assignedProviderId.userId?.name || r.assignedProviderId._id
                  : "Not assigned"}
              </div>
            </div>
            <div className="text-right text-xs">
              <div>Status: {r.status}</div>
              <div className="text-slate-500 mt-1">
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        {!loadError && requests.length === 0 && (
          <div className="p-3 text-xs text-slate-500">No requests yet.</div>
        )}
      </div>
    </div>
  );
}

