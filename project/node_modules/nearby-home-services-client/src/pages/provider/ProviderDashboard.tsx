import { useEffect, useState } from "react";
import { api, uploadsBase } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { Link, useNavigate } from "react-router-dom";
import { RevealOnScroll } from "../../components/RevealOnScroll";

export function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any | null>(null);
  const [availability, setAvailability] = useState("OFFLINE");
  const [message, setMessage] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const socket = useSocket();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/provider/me");
        setProvider(res.data.provider);
        setAvailability(res.data.provider.availability);

        // Load open requests so provider doesn't miss socket events
        if (res.data.provider.verificationStatus === "APPROVED" && res.data.provider.availability === "AVAILABLE") {
          const open = await api.get("/provider/open-requests");
          setIncomingRequests(
            open.data.requests.map((r: any) => ({
              requestId: r._id,
              category: r.category,
              description: r.description,
              customerLocation: r.customerLocation
            }))
          );
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!socket || !user?.id) return;
    const userId = String(user.id);
    socket.emit("join:provider", userId);
    const onNew = (payload: any) => {
      setIncomingRequests((prev) => [...prev, payload]);
    };
    const onTaken = (payload: any) => {
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== payload.requestId));
    };
    socket.on("request:new", onNew);
    socket.on("request:taken", onTaken);
    return () => {
      socket.off("request:new", onNew);
      socket.off("request:taken", onTaken);
    };
  }, [socket, user]);

  const updateAvailability = async (value: string) => {
    try {
      const res = await api.patch("/provider/availability", { availability: value });
      setProvider(res.data.provider);
      setAvailability(res.data.provider.availability);
      setMessage("Availability updated");

      if (res.data.provider.verificationStatus === "APPROVED" && res.data.provider.availability === "AVAILABLE") {
        const open = await api.get("/provider/open-requests");
        setIncomingRequests(
          open.data.requests.map((r: any) => ({
            requestId: r._id,
            category: r.category,
            description: r.description,
            customerLocation: r.customerLocation
          }))
        );
      } else {
        setIncomingRequests([]);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to update availability");
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const res = await api.post(`/requests/${requestId}/accept`);
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      setMessage("Request accepted");
      // go to detailed job page for full workflow
      navigate(`/provider/request/${requestId}`);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to accept request");
    }
  };

  if (!user || user.role !== "PROVIDER") {
    return (
      <div className="text-sm text-slate-100">
        Please login as a Service Provider to see this page.
      </div>
    );
  }

  if (!provider) {
    return <div className="text-sm text-slate-200">Loading Service Provider profile...</div>;
  }

  return (
    <div className="space-y-5">
      <RevealOnScroll>
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-2xl shadow-xl shadow-black/80 p-5 flex items-center gap-4 border border-white/10">
          <img
            src={provider.profileImage?.startsWith("http") ? provider.profileImage : `${uploadsBase}${provider.profileImage}`}
            alt="Profile"
            className="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-md shadow-black/70"
          />
          <div className="text-sm text-slate-100">
            <div className="font-semibold text-base">{provider.userId?.name}</div>
            <div className="text-xs text-slate-300">
              {provider.address} · {provider.categories?.join(", ")}
            </div>
            <div className="mt-1 text-xs">
              Verification status:{" "}
              <span className="font-semibold text-sky-300">{provider.verificationStatus}</span>
            </div>
            {provider.verificationStatus === "PENDING" && (
              <div className="text-xs text-amber-300 mt-1">
                Your Service Provider profile is under review by the admin team.
              </div>
            )}
            {provider.verificationStatus === "REJECTED" && (
              <div className="text-xs text-red-300 mt-1">
                Rejected: {provider.verificationNotes || "No reason provided."}{" "}
                <span className="block">
                  Your registration was rejected. You can reapply after 24 hours from the rejection
                  time.
                </span>
              </div>
            )}
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delayMs={80}>
        <div className="bg-slate-950/70 rounded-2xl shadow-lg shadow-black/70 p-4 flex items-center justify-between text-sm border border-white/10">
          <div>
            <div className="font-semibold mb-1 text-slate-50">Availability</div>
            <div className="text-xs text-slate-300">
              You can go AVAILABLE only after admin approval as a Service Provider.
            </div>
          </div>
          <div className="flex gap-2">
            {["AVAILABLE", "OFFLINE", "BUSY"].map((a) => (
              <button
                key={a}
                onClick={() => updateAvailability(a)}
                className={`px-3 py-1 rounded text-xs border transition-colors transition-transform duration-150 hover:-translate-y-0.5 ${
                  availability === a
                    ? "bg-sky-500 text-slate-950 border-sky-400 shadow-sm shadow-sky-900/70"
                    : "bg-slate-900 text-slate-100 border-slate-600 hover:bg-slate-800"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </RevealOnScroll>

      {message && <div className="text-xs text-slate-200">{message}</div>}

      <RevealOnScroll delayMs={140}>
        <div className="bg-slate-950/70 rounded-2xl shadow-lg shadow-black/80 p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-slate-50">Incoming Requests</div>
            <Link to="/admin/requests" className="text-xs text-indigo-400 hover:text-indigo-300 underline">
              View all (admin)
            </Link>
          </div>
          {incomingRequests.length === 0 && (
            <div className="text-xs text-slate-300">No new requests yet.</div>
          )}
          <div className="space-y-2">
            {incomingRequests.map((r) => (
              <div
                key={r.requestId}
                className="border border-slate-700/80 rounded-xl p-3 flex items-center justify-between text-xs bg-slate-900/70 transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div>
                  <div className="font-medium text-slate-50">{r.category}</div>
                  <div className="text-slate-300">{r.description}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/provider/request/${r.requestId}`)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-emerald-950 font-medium hover:bg-emerald-400 transition-colors"
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}

