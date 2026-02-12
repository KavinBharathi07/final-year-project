import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { RevealOnScroll } from "../../components/RevealOnScroll";

type HeroSlide = {
  id: number;
  role: string;
  headline: string;
  imageUrl: string;
};

const heroSlides: HeroSlide[] = [
  {
    id: 0,
    role: "Carpenter",
    headline: "Crafted woodwork and precise repairs handled by expert carpenters.",
    imageUrl:
      "https://images.pexels.com/photos/4246239/pexels-photo-4246239.jpeg?auto=compress&cs=tinysrgb&w=900"
  },
  {
    id: 1,
    role: "Mechanic",
    headline: "Keep your AC and appliances running with trusted mechanics on call.",
    imageUrl:
      "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=900"
  },
  {
    id: 2,
    role: "Electrician",
    headline: "Safe, reliable electrical work from vetted local electricians.",
    imageUrl:
      "https://images.pexels.com/photos/4254168/pexels-photo-4254168.jpeg?auto=compress&cs=tinysrgb&w=900"
  }
];

const categories = [
  { id: "plumber", label: "Plumber" },
  { id: "electrician", label: "Electrician" },
  { id: "ac-mechanic", label: "AC Mechanic" },
  { id: "carpenter", label: "Carpenter" }
];

export function CustomerHomePage() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "CUSTOMER") return;
    api
      .get("/requests")
      .then((res) => setMyRequests(res.data.requests || []))
      .catch(() => setMyRequests([]));
  }, [user]);

  useEffect(() => {
    const timer = setInterval(
      () => setHeroIndex((prev) => (prev + 1) % heroSlides.length),
      6000
    );
    return () => clearInterval(timer);
  }, []);

  if (!user || user.role !== "CUSTOMER") {
    return <div className="text-sm text-slate-700">Please log in as a customer.</div>;
  }

  const active = myRequests.filter((r) => r.status !== "PAYMENT_CONFIRMED");
  const past = myRequests.filter((r) => r.status === "PAYMENT_CONFIRMED");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <RevealOnScroll>
        <div className="grid md:grid-cols-[1.5fr,1.1fr] gap-6 items-center rounded-2xl p-6 md:p-7 border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-slate-50 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Welcome back, <span className="text-sky-700">{user.name}</span>
            </h1>
            <div className="mt-3 h-12 relative overflow-hidden">
              {heroSlides.map((slide, index) => (
                <p
                  key={slide.id}
                  className={`absolute inset-0 text-sm text-slate-600 max-w-md transition-all duration-500 ease-out ${
                    index === heroIndex
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3 pointer-events-none"
                  }`}
                >
                  <span className="font-semibold text-sky-700">{slide.role}</span> · {slide.headline}
                </p>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Verified Service Providers
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700">
                Live tracking
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                Request only when needed
              </span>
            </div>
          </div>
          <div className="relative h-48 md:h-60">
            <div className="absolute inset-0 rounded-3xl overflow-hidden border border-sky-100">
              {heroSlides.map((slide, index) => (
                <img
                  key={slide.id}
                  src={slide.imageUrl}
                  alt={slide.role}
                  className={`h-full w-full object-cover absolute inset-0 transition-opacity duration-700 ease-out ${
                    index === heroIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-900/25 via-sky-500/10 to-transparent" />
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-slate-50">
              <div className="px-2 py-1 rounded-full bg-slate-900/70 backdrop-blur border border-white/30">
                Connext
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-400 text-emerald-950 font-semibold shadow-sm shadow-emerald-500/40">
                <span className="hidden sm:inline">Live now ·</span>
                <span>{heroSlides[heroIndex].role}</span>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {myRequests.length > 0 && (
        <RevealOnScroll delayMs={80}>
          <div className="bg-white rounded-2xl shadow-md shadow-slate-900/10 p-6 border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">My requests</h2>
            {active.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-amber-700 mb-2">Ongoing</div>
                <ul className="space-y-2">
                  {active.map((r) => (
                    <li
                      key={r._id}
                      className="flex items-center justify-between border border-slate-200 rounded-lg p-3 text-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
                    >
                      <div>
                        <span className="font-medium text-slate-900">{r.category}</span>
                        <span className="text-slate-500 ml-2">· {r.status}</span>
                      </div>
                      <Link
                        to={`/customer/request/${r._id}`}
                        className="text-sky-600 font-medium hover:underline"
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">Completed</div>
                <ul className="space-y-2">
                  {past.map((r) => (
                    <li
                      key={r._id}
                      className="flex items-center justify-between border border-slate-200 bg-slate-50 rounded-lg p-3 text-sm text-slate-700 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <span>
                        {r.category} · {r.status}
                      </span>
                      <Link to={`/customer/request/${r._id}`} className="text-sky-600 hover:underline">
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </RevealOnScroll>
      )}

      <RevealOnScroll delayMs={140}>
        <div className="bg-white rounded-2xl shadow-md shadow-slate-900/10 p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Service categories</h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose what you need and a nearby Service Provider will pick it up.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Real people, verified profiles
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="relative overflow-hidden border border-sky-100 rounded-xl p-3 bg-gradient-to-br from-sky-50 via-white to-slate-50 hover:border-sky-300 hover:-translate-y-0.5 transition-colors transition-transform"
              >
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-sky-400/10 blur-xl" />
                <div className="relative">
                  <div className="font-medium text-slate-900">{c.label}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Nearby verified Service Providers can accept your request.
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link
              to="/customer/new-request"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 text-sm font-semibold hover:bg-sky-400 shadow-sm shadow-sky-900/40 transition-transform duration-200 hover:-translate-y-0.5"
            >
              Create a new service request
            </Link>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}

