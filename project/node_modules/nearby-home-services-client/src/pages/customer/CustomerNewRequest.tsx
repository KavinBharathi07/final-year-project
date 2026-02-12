import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { Map } from "../../components/Map";
import { useAuth } from "../../context/AuthContext";
import type { LatLng } from "../../components/Map";

export function CustomerNewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState("plumber");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [nearbyProviders, setNearbyProviders] = useState<LatLng[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 12.9716, lng: 77.5946 })
      );
    } else {
      setLocation({ lat: 12.9716, lng: 77.5946 });
    }
  }, [location]);

  useEffect(() => {
    if (!location) return;
    const fetchNearby = async () => {
      try {
        const res = await api.get("/provider/nearby", {
          params: { lat: location.lat, lng: location.lng, category }
        });
        setNearbyProviders(
          res.data.providers.map((p: { location: { coordinates: number[] } }) => ({
            lat: p.location.coordinates[1],
            lng: p.location.coordinates[0]
          }))
        );
      } catch {
        setNearbyProviders([]);
      }
    };
    fetchNearby();
  }, [location, category]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!location) {
      setError("Please select your location on the map (search or click).");
      return;
    }
    try {
      const res = await api.post("/requests", {
        category,
        description,
        lat: location.lat,
        lng: location.lng
      });
      navigate(`/customer/request/${res.data.request._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create request");
    }
  };

  if (!user || user.role !== "CUSTOMER") {
    return (
      <div className="text-sm text-slate-700">
        Please log in as a customer to create a request.
      </div>
    );
  }

  const center = location ?? { lat: 12.9716, lng: 77.5946 };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-4 md:p-6">
        <h1 className="text-lg font-semibold mb-3">New Service Request</h1>
        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block mb-1 font-medium">Category</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="plumber">Plumber</option>
              <option value="electrician">Electrician</option>
              <option value="ac-mechanic">AC Mechanic</option>
              <option value="carpenter">Carpenter</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
            />
          </div>

          <div className="pt-2">
            <label className="block mb-2 font-medium">Where do you need service?</label>
            <Map
              center={center}
              customerLocation={location ?? undefined}
              nearbyProviders={nearbyProviders}
              onSelectLocation={setLocation}
              showSearch
              placeholder="Search city or address..."
            />
            {nearbyProviders.length > 0 && (
              <p className="mt-2 text-xs text-emerald-600">
                {nearbyProviders.length} nearby provider(s) available in your area.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white rounded-lg py-2.5 font-medium hover:bg-emerald-700"
          >
            Request Service
          </button>
        </form>
      </div>
    </div>
  );
}
