import "mapbox-gl/dist/mapbox-gl.css";
import { useRef, useEffect, useState } from "react";
import MapGL, { Marker, Source, Layer, MapLayerMouseEvent, MapRef } from "react-map-gl";

export type LatLng = { lat: number; lng: number };

type MapProps = {
  center: LatLng;
  customerLocation?: LatLng;
  providerLocation?: LatLng;
  nearbyProviders?: LatLng[];
  onSelectLocation?: (coords: LatLng) => void;
  showSearch?: boolean;
  placeholder?: string;
};

const lineLayer = {
  id: "route",
  type: "line",
  paint: {
    "line-color": "#4f46e5",
    "line-width": 3
  }
} as const;

const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

export function Map({
  center,
  customerLocation,
  providerLocation,
  nearbyProviders,
  onSelectLocation,
  showSearch = false,
  placeholder = "Search location (e.g. city, address)"
}: MapProps) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const effectiveCenter = center?.lat != null && center?.lng != null ? center : DEFAULT_CENTER;

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !center?.lat || !center?.lng) return;
    map.flyTo({ center: [center.lng, center.lat], zoom: 14, duration: 1000 });
  }, [center?.lat, center?.lng]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q || !token || !onSelectLocation) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&limit=1`
      );
      const data = await res.json();
      if (data.features?.[0]?.center) {
        const [lng, lat] = data.features[0].center;
        onSelectLocation({ lat, lng });
      }
    } catch {
      // ignore
    }
    setSearching(false);
  };

  if (!token) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-100 rounded-lg text-red-600 text-sm">
        Set VITE_MAPBOX_TOKEN in client/.env
      </div>
    );
  }

  const routeGeoJson =
    customerLocation && providerLocation
      ? {
          type: "FeatureCollection" as const,
          features: [
            {
              type: "Feature" as const,
              geometry: {
                type: "LineString" as const,
                coordinates: [
                  [providerLocation.lng, providerLocation.lat],
                  [customerLocation.lng, customerLocation.lat]
                ]
              },
              properties: {}
            }
          ]
        }
      : null;

  return (
    <div className="w-full flex flex-col gap-2">
      {showSearch && onSelectLocation && (
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>
      )}
      <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
        <MapGL
          ref={mapRef}
          initialViewState={{
            longitude: effectiveCenter.lng,
            latitude: effectiveCenter.lat,
            zoom: 13
          }}
          mapboxAccessToken={token}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: "100%", height: "100%" }}
          onClick={(e: MapLayerMouseEvent) => {
            if (!onSelectLocation) return;
            const { lng, lat } = e.lngLat;
            onSelectLocation({ lng, lat });
          }}
          cursor={onSelectLocation ? "crosshair" : "grab"}
        >
          {customerLocation && (
            <Marker longitude={customerLocation.lng} latitude={customerLocation.lat} anchor="bottom">
              <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white">
                You
              </div>
            </Marker>
          )}
          {providerLocation && (
            <Marker longitude={providerLocation.lng} latitude={providerLocation.lat} anchor="bottom">
              <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white">
                P
              </div>
            </Marker>
          )}
          {nearbyProviders?.map((p, idx) => (
            <Marker key={idx} longitude={p.lng} latitude={p.lat} anchor="bottom">
              <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow flex items-center justify-center text-[9px] font-bold text-white">
                S
              </div>
            </Marker>
          ))}
          {routeGeoJson && (
            <Source id="route" type="geojson" data={routeGeoJson}>
              <Layer {...lineLayer} />
            </Source>
          )}
        </MapGL>
      </div>
      {onSelectLocation && (
        <p className="text-xs text-slate-500">
          Search above or click on the map to set your location. Orange pins = nearby providers.
        </p>
      )}
    </div>
  );
}
