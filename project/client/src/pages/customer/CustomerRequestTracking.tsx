import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, uploadsBase } from "../../lib/api";
import { Map } from "../../components/Map";
import { useSocket } from "../../hooks/useSocket";

export function CustomerRequestTracking() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<any | null>(null);
  const [providerLocation, setProviderLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data.request);
    };
    fetchRequest();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join:request", id);
    socket.on("provider:locationUpdate", (payload: any) => {
      if (payload.requestId === id) {
        setProviderLocation(payload.coords);
      }
    });
    socket.on("request:statusUpdate", (payload: any) => {
      if (payload.requestId === id) {
        setRequest((prev: any) => (prev ? { ...prev, status: payload.status } : prev));
      }
    });
    socket.on("request:accepted", (payload: any) => {
      if (payload.requestId === id) {
        setRequest((prev: any) => (prev ? { ...prev, status: "ACCEPTED" } : prev));
      }
    });
    return () => {
      socket.off("provider:locationUpdate");
      socket.off("request:statusUpdate");
      socket.off("request:accepted");
    };
  }, [socket, id]);

  if (!request) {
    return <div className="text-sm text-slate-600">Loading request...</div>;
  }

  const customerLocation = {
    lat: request.customerLocation.coordinates[1],
    lng: request.customerLocation.coordinates[0]
  };

  const providerProfile = request.assignedProviderId;
  // Fallback: show provider's registered location until live updates arrive
  const providerFallback =
    providerProfile?.location?.coordinates?.length === 2
      ? { lat: providerProfile.location.coordinates[1], lng: providerProfile.location.coordinates[0] }
      : null;
  const mapProviderLocation = providerLocation ?? providerFallback ?? undefined;

  const confirmCompletion = async () => {
    if (!id) return;
    setActionMessage(null);
    try {
      const res = await api.post(`/requests/${id}/confirm-completion`);
      setRequest(res.data.request);
      setActionMessage("You confirmed the service is completed.");
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || "Failed to confirm completion");
    }
  };

  const refreshMap = async () => {
    if (!id) return;
    setProviderLocation(null);
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data.request);
    } catch {
      // keep current request
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Request #{request._id}
          </div>
          <div className="text-sm font-semibold">{request.category}</div>
          <div className="text-xs text-slate-600 mt-1">{request.description}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">Status</div>
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">
            {request.status}
          </div>
        </div>
      </div>

      {providerProfile && (
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <img
            src={providerProfile.profileImage?.startsWith("http") ? providerProfile.profileImage : `${uploadsBase}${providerProfile.profileImage}`}
            alt="Provider"
            className="w-14 h-14 rounded-full object-cover border"
          />
          <div className="text-sm">
            <div className="font-semibold">{providerProfile.userId?.name}</div>
            <div className="text-xs text-slate-600">
              {providerProfile.address} · {providerProfile.categories?.join(", ")}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-sm font-semibold">Live Tracking</div>
          <button
            type="button"
            onClick={refreshMap}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
          >
            Refresh map
          </button>
        </div>
        {!mapProviderLocation && providerProfile && (
          <p className="text-xs text-slate-500 mb-2">
            Provider location will appear when they share it (e.g. when on the way).
          </p>
        )}
        <Map
          center={mapProviderLocation || customerLocation}
          customerLocation={customerLocation}
          providerLocation={mapProviderLocation}
        />
        {request.status === "COMPLETION_REQUESTED" && (
          <div className="mt-3 p-3 rounded bg-amber-50 border border-amber-200">
            <div className="text-sm font-semibold text-amber-800">
              Provider marked work as completed
            </div>
            <div className="text-xs text-amber-700 mt-1">
              Please confirm if the service is truly completed.
            </div>
            <button
              onClick={confirmCompletion}
              className="mt-2 px-3 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Yes, service is completed
            </button>
          </div>
        )}
        {request.status === "COMPLETED" && (
          <div className="mt-3 p-3 rounded bg-indigo-50 border border-indigo-200">
            <div className="text-sm font-semibold text-indigo-800">Completion confirmed</div>
            <div className="text-xs text-indigo-700 mt-1">
              Pay the provider (cash/UPI outside the app). The provider will confirm payment received.
            </div>
          </div>
        )}
        {request.status === "PAYMENT_CONFIRMED" && (
          <div className="mt-3 p-3 rounded bg-emerald-50 border border-emerald-200">
            <div className="text-sm font-semibold text-emerald-800">Session finished</div>
            <div className="text-xs text-emerald-700 mt-1">
              Provider confirmed payment received. Thank you!
            </div>
          </div>
        )}
        {actionMessage && <div className="mt-2 text-xs text-slate-700">{actionMessage}</div>}
      </div>
    </div>
  );
}

