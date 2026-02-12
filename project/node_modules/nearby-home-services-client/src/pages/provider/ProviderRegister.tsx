import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { Map } from "../../components/Map";
import type { LatLng } from "../../components/Map";

const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

export function ProviderRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    categories: "plumber",
    address: ""
  });
  const [location, setLocation] = useState<LatLng | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [optionalCert, setOptionalCert] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (location) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(DEFAULT_CENTER)
      );
    } else {
      setLocation(DEFAULT_CENTER);
    }
  }, [location]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!profileImage || !idProof) {
      setError("Profile image and ID proof are required.");
      return;
    }
    if (!location) {
      setError("Please select your service location on the map (search or click).");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("password", form.password);
      fd.append("role", "PROVIDER");
      fd.append("categories", form.categories);
      fd.append("address", form.address);
      fd.append("lat", String(location.lat));
      fd.append("lng", String(location.lng));
      fd.append("profileImage", profileImage);
      fd.append("idProof", idProof);
      if (optionalCert) fd.append("optionalCert", optionalCert);

      // Let axios/browser set the correct multipart boundary header
      await api.post("/auth/register", fd);
      setSuccess("Registration successful! Please wait for admin approval.");
      setTimeout(() => navigate("/login/provider"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const center = location ?? DEFAULT_CENTER;

  return (
    <div className="max-w-3xl mx-auto bg-slate-950/70 rounded-2xl shadow-[0_22px_70px_rgba(15,23,42,0.95)] p-6 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-semibold mb-1 text-slate-50">Service Provider Registration</h1>
          <p className="text-xs text-slate-300">
            Create your professional profile so customers can find and book you.
          </p>
        </div>
        <img
          src="https://images.pexels.com/photos/5598290/pexels-photo-5598290.jpeg?auto=compress&cs=tinysrgb&w=400"
          alt="Service Provider"
          className="hidden sm:block h-14 w-14 rounded-2xl object-cover border border-white/20 shadow-md shadow-black/70"
        />
      </div>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      {success && (
        <div className="mb-3 text-sm text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 p-2 rounded">
          {success}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4 text-sm text-slate-100">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block mb-1 font-medium">Full name</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                name="name"
                value={form.name}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Phone</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Primary service category</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                name="categories"
                value={form.categories}
                onChange={onChange}
              >
                <option value="plumber">Plumber</option>
                <option value="electrician">Electrician</option>
                <option value="ac-mechanic">AC Mechanic</option>
                <option value="carpenter">Carpenter</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Service address</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                name="address"
                value={form.address}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Profile photo (required)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Government ID proof (required)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full text-sm"
                onChange={(e) => setIdProof(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Certificates (optional)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full text-sm"
                onChange={(e) => setOptionalCert(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">Your service location</label>
            <p className="text-xs text-slate-300 mb-2">
              Search or click on the map so we can show your profile to nearby customers.
            </p>
            <Map
              center={center}
              customerLocation={location ?? undefined}
              onSelectLocation={setLocation}
              showSearch
              placeholder="Search city or address..."
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-sky-500 text-slate-950 rounded-xl py-2.5 font-semibold hover:bg-sky-400 shadow-sm shadow-sky-900/70"
          >
            Register as Service Provider
          </button>
        </div>
      </form>
    </div>
  );
}
