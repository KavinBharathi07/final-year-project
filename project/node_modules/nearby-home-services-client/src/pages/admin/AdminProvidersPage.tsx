import { useEffect, useState } from "react";
import { api, uploadsBase } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export function AdminProvidersPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/admin/providers");
        setProviders(res.data.providers);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const refresh = async () => {
    const res = await api.get("/admin/providers");
    setProviders(res.data.providers);
  };

  const approve = async (id: string) => {
    await api.post(`/admin/provider/${id}/approve`, { notes: "Verified by admin" });
    setMessage("Provider approved");
    refresh();
  };

  const reject = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    await api.post(`/admin/provider/${id}/reject`, { reason });
    setMessage("Provider rejected");
    refresh();
  };

  const deactivate = async (id: string) => {
    await api.post(`/admin/provider/${id}/deactivate`);
    setMessage("Provider deactivated");
    refresh();
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="text-sm text-slate-700">
        Please login as an admin to view Service Providers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Service Providers</h1>
        {message && <div className="text-xs text-slate-700">{message}</div>}
      </div>
      <div className="bg-white rounded-lg shadow divide-y">
        {providers.map((p) => (
          <div key={p._id} className="p-3 flex items-center gap-3 text-sm">
            <img
              src={p.profileImage?.startsWith("http") ? p.profileImage : `${uploadsBase}${p.profileImage}`}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border"
            />
            <div className="flex-1">
              <div className="font-semibold">{p.userId?.name}</div>
              <div className="text-xs text-slate-600">
                {p.userId?.email} · {p.userId?.phone}
              </div>
              <div className="text-xs text-slate-600">
                {p.address} · {p.categories?.join(", ")}
              </div>
              <div className="mt-1 text-xs">
                Status: <span className="font-medium">{p.verificationStatus}</span> · Active:{" "}
                {p.isActive ? "Yes" : "No"}
              </div>
              <div className="mt-1 flex gap-2 text-xs">
                <a
                  href={p.documents?.idProofUrl?.startsWith("http") ? p.documents.idProofUrl : `${uploadsBase}${p.documents?.idProofUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline"
                >
                  ID Proof
                </a>
                {p.documents?.optionalCertUrl && (
                  <a
                    href={p.documents.optionalCertUrl?.startsWith("http") ? p.documents.optionalCertUrl : `${uploadsBase}${p.documents.optionalCertUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline"
                  >
                    Certificate
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => approve(p._id)}
                className="px-3 py-1 rounded bg-emerald-600 text-white text-xs"
              >
                Approve
              </button>
              <button
                onClick={() => reject(p._id)}
                className="px-3 py-1 rounded bg-red-600 text-white text-xs"
              >
                Reject
              </button>
              <button
                onClick={() => deactivate(p._id)}
                className="px-3 py-1 rounded bg-slate-700 text-white text-xs"
              >
                Deactivate
              </button>
            </div>
          </div>
        ))}
        {providers.length === 0 && (
          <div className="p-3 text-xs text-slate-500">No providers registered yet.</div>
        )}
      </div>
    </div>
  );
}

