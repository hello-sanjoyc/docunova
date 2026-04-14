"use client";

import { useEffect, useState } from "react";

export default function MoveToUpButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsVisible(window.scrollY > 150);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-6 bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-amber text-cream shadow-[0_8px_24px_rgba(15,14,12,0.28)] transition-colors hover:bg-amber-dark focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2"
      aria-label="Scroll to top"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14" />
        <path d="m6 11 6-6 6 6" />
      </svg>
    </button>
  );
}
