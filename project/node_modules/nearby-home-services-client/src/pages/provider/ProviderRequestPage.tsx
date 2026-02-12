import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useSocket } from "../../hooks/useSocket";
import { Map } from "../../components/Map";

export function ProviderRequestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any | null>(null);
  const [providerLocation, setProviderLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const socket = useSocket();

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data.request);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join:request", id);
  }, [socket, id]);

  // Auto-send location every 5s when provider is on the way / arrived / working (so customer map updates)
  useEffect(() => {
    if (!socket || !id || !navigator.geolocation) return;
    const statuses = ["ON_THE_WAY", "ARRIVED", "WORK_STARTED"];
    if (!request || !statuses.includes(request.status)) return;
    const send = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setProviderLocation((prev) => prev ?? coords);
          socket.emit("provider:locationUpdate", { requestId: id, coords });
        },
        () => {}
      );
    };
    send();
    const interval = setInterval(send, 5000);
    return () => clearInterval(interval);
  }, [socket, id, request?.status]);

  const sendStatus = async (status: string) => {
    if (!id) return;
    await api.post(`/requests/${id}/status`, { status });
    setRequest((prev: any) => (prev ? { ...prev, status } : prev));
  };

  const sendPaymentConfirm = async () => {
    if (!id) return;
    await api.post(`/requests/${id}/payment-confirm`);
    setRequest((prev: any) => (prev ? { ...prev, status: "PAYMENT_CONFIRMED" } : prev));
  };

  const sendLocationUpdate = () => {
    if (!socket || !id) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setProviderLocation(coords);
      socket.emit("provider:locationUpdate", { requestId: id, coords });
    });
  };

  const acceptRequest = async () => {
    if (!id) return;
    try {
      const res = await api.post(`/requests/${id}/accept`);
      setRequest(res.data.request);
    } catch {
      navigate("/provider/dashboard");
    }
  };

  if (!request) {
    return <div className="text-sm text-slate-200">Loading request...</div>;
  }

  const customerLocation = {
    lat: request.customerLocation.coordinates[1],
    lng: request.customerLocation.coordinates[0]
  };

  const isAssigned = Boolean(request.assignedProviderId);

  return (
    <div className="space-y-4">
      <div className="bg-slate-950/70 rounded-2xl shadow-lg shadow-black/80 p-4 border border-white/10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
              Service Request #{request._id}
            </div>
            <div className="text-sm font-semibold text-slate-50">{request.category}</div>
            <div className="text-xs text-slate-300 mt-1">{request.description}</div>
          </div>
          <div className="text-right text-xs">
            <div className="text-slate-400 mb-1">Status</div>
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/50">
              {request.status}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80">
            <div className="text-xs text-slate-400 mb-1">Customer location</div>
            <div className="text-xs text-slate-100">
              Lat {customerLocation.lat.toFixed(5)}, Lng {customerLocation.lng.toFixed(5)}
            </div>
          </div>
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80">
            <div className="text-xs text-slate-400 mb-1">Customer details</div>
            <div className="text-xs text-slate-100">{request.customerId?.name}</div>
            <div className="text-xs text-slate-300">
              {request.customerId?.email} · {request.customerId?.phone}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Review the customer's location and contact details before accepting this request.
            </p>
          </div>
        </div>
        {request.status === "REQUEST_SENT" && !request.assignedProviderId && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-300">
              By clicking <span className="font-semibold text-emerald-300">Accept Request</span>, you
              confirm that you’ve reviewed the customer’s details and can take this job.
            </p>
            <button
              onClick={acceptRequest}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-emerald-950 text-xs font-semibold hover:bg-emerald-400 shadow-sm shadow-emerald-900/80"
            >
              Accept Request
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-950/70 rounded-2xl shadow-lg shadow-black/80 p-4 border border-white/10">
        <div className="flex flex-wrap gap-2 text-xs mb-2">
          <button
            onClick={() => sendStatus("ON_THE_WAY")}
            disabled={!isAssigned}
            className="px-3 py-1.5 rounded bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark ON_THE_WAY
          </button>
          <button
            onClick={() => sendStatus("ARRIVED")}
            disabled={!isAssigned}
            className="px-3 py-1.5 rounded bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark ARRIVED
          </button>
          <button
            onClick={() => sendStatus("WORK_STARTED")}
            disabled={!isAssigned}
            className="px-3 py-1.5 rounded bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark WORK_STARTED
          </button>
          <button
            onClick={() => sendStatus("COMPLETION_REQUESTED")}
            disabled={!isAssigned}
            className="px-3 py-1.5 rounded bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Request COMPLETION (customer confirms)
          </button>
          <button
            onClick={sendPaymentConfirm}
            className="px-3 py-1.5 rounded bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isAssigned || request.status !== "COMPLETED"}
          >
            Confirm PAYMENT_RECEIVED
          </button>
          <button
            onClick={sendLocationUpdate}
            disabled={!isAssigned}
            className="px-3 py-1.5 rounded bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send location update
          </button>
        </div>
        <Map
          center={providerLocation || customerLocation}
          customerLocation={customerLocation}
          providerLocation={providerLocation || undefined}
        />
        <p className="text-xs text-slate-400 mt-2">
          Accept the request first to unlock status updates. Flow: ARRIVED → (auto) WORK_STARTED →
          Request completion → Customer confirms → Service Provider confirms payment.
        </p>
      </div>
    </div>
  );
}

