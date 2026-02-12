import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type RoleSlide = {
  id: number;
  role: string;
  tagline: string;
  imageUrl: string;
};

const roleSlides: RoleSlide[] = [
  {
    id: 0,
    role: "Carpenter",
    tagline: "Perfect for precise woodwork, furniture fixes and custom builds.",
    imageUrl:
      "https://images.pexels.com/photos/4246239/pexels-photo-4246239.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    id: 1,
    role: "Mechanic",
    tagline: "Ideal for appliance repairs and mechanical troubleshooting at home.",
    imageUrl:
      "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    id: 2,
    role: "Electrician",
    tagline: "Safe hands for wiring, lighting and power issues in any room.",
    imageUrl:
      "https://images.pexels.com/photos/4254168/pexels-photo-4254168.jpeg?auto=compress&cs=tinysrgb&w=800"
  }
];

export function LoginChoicePage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setActive((prev) => (prev + 1) % roleSlides.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid md:grid-cols-2 min-h-[360px] gap-0 rounded-3xl overflow-hidden shadow-[0_22px_60px_rgba(15,23,42,0.45)]">
      {/* Left visual panel */}
      <div className="relative bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 text-white p-8 flex flex-col justify-between">
        <div className="absolute -left-16 -top-24 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute -right-20 bottom-[-4rem] h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 max-w-sm space-y-4">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[11px] font-medium backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Connext • Smart home services
          </p>
          <h1 className="text-2xl font-semibold leading-snug">
            Find the right Service Provider
            <span className="block text-sky-100">for every home task.</span>
          </h1>
          <p className="text-sm text-sky-50/90">
            Browse trusted professionals, see their details, and book in minutes with live updates
            along the way.
          </p>
        </div>

        <div className="relative z-10 mt-6 flex justify-center md:justify-start">
          <div className="relative h-64 w-64 sm:w-72 lg:w-80 rounded-3xl overflow-hidden bg-white/10 border border-sky-200/40 shadow-[0_16px_40px_rgba(15,23,42,0.55)]">
            {roleSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 flex flex-col transition-opacity duration-700 ease-out ${
                  index === active ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.role}
                  className="w-full h-40 object-cover"
                />
                
                {/* Indicators moved ABOVE text overlay */}
                <div className="absolute top-2 inset-x-0 flex justify-center gap-1.5 z-20 pt-1">
                  {roleSlides.map((_, dotIndex) => (
                    <button
                      key={dotIndex}
                      type="button"
                      onClick={() => setActive(dotIndex)}
                      className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all ${
                        dotIndex === active ? "bg-white shadow-md" : "bg-white/50"
                      }`}
                      aria-label={`Go to ${roleSlides[dotIndex].role}`}
                    />
                  ))}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-[11px] font-medium text-sky-900 bg-sky-50 px-2 text-center pt-10 pb-4">
                  <span className="uppercase tracking-wide text-sky-700">{slide.role}</span>
                  <span className="mt-1 text-slate-600">{slide.tagline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login / role selection panel */}
      <div className="bg-slate-950 text-slate-50 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center border border-sky-500/40 shadow-sm shadow-slate-900/60">
              <span className="text-sky-400 text-xl font-bold">CX</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Welcome to Connext</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose how you want to continue. You can always switch roles later.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <Link
              to="/login/customer"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-400 hover:bg-slate-900/80 transition-colors"
            >
              <div>
                <div className="font-medium text-slate-50">I'm a Customer</div>
                <div className="text-[11px] text-slate-400">
                  Request home services and track your bookings.
                </div>
              </div>
              <span className="text-sky-400 text-xs">Continue</span>
            </Link>

            <Link
              to="/login/provider"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 border border-sky-300 transition-colors shadow-sm shadow-sky-900/60"
            >
              <div>
                <div className="font-semibold">I'm a Service Provider</div>
                <div className="text-[11px] text-slate-900/80">
                  Get matched with nearby customers in real time.
                </div>
              </div>
              <span className="text-xs font-semibold">Continue</span>
            </Link>

            <Link
              to="/login/admin"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-400 hover:bg-slate-900/80 transition-colors"
            >
              <div>
                <div className="font-medium text-slate-50">I'm an Admin</div>
                <div className="text-[11px] text-slate-400">
                  Review Service Providers and monitor all requests.
                </div>
              </div>
              <span className="text-sky-400 text-xs">Continue</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
