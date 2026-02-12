import { useEffect, useRef, useState } from "react";

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delayMs?: number;
};

export function RevealOnScroll({
  children,
  className = "",
  direction = "up",
  delayMs = 0
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Respect reduced motion preference
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.18 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseHidden =
    direction === "up"
      ? "opacity-0 translate-y-6"
      : direction === "down"
      ? "opacity-0 -translate-y-6"
      : direction === "left"
      ? "opacity-0 -translate-x-6"
      : "opacity-0 translate-x-6";

  const baseVisible = "opacity-100 translate-y-0 translate-x-0";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`will-change-transform will-change-opacity transform-gpu transition-all duration-500 ease-out ${
        visible ? baseVisible : baseHidden
      } ${className}`}
    >
      {children}
    </div>
  );
}

