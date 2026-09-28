"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="animate-fade-up fixed bottom-6 right-6 z-20 rounded-full border border-signal/40 bg-ink/90 p-3 text-signal shadow-lg backdrop-blur transition hover:bg-signal/10 active:scale-95"
    >
      <ArrowUp className="h-4 w-4" aria-hidden />
    </button>
  );
}
