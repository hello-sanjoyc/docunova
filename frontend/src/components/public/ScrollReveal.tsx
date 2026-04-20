"use client";

/**
 * ScrollReveal
 *
 * Wraps any section in a one-shot fade-up reveal triggered by the
 * IntersectionObserver API. Renders a plain <div> with the `scroll-reveal`
 * class (opacity:0 + translateY by default), then adds `visible` once the
 * element crosses the viewport threshold.
 *
 * Why one-shot (unobserve after first intersect):
 *   Elements animate in once, stay visible, and stop being tracked — avoids
 *   re-animating on scroll-up and keeps the observer list lean.
 *
 * Threshold 0.1 (10% visible):
 *   Fires early enough that the animation completes before the user reaches
 *   the element, but not at 0 (which fires at the very bottom pixel edge and
 *   feels laggy on fast scrolls).
 */

import { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Forwarded as the id attribute — used for anchor nav (e.g. #features). */
  id?: string;
}

export default function ScrollReveal({ children, className = "", id }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            // Unobserve immediately — animation plays once, no repeat.
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    // disconnect() rather than unobserve() in cleanup: the component is
    // unmounting so we want to release the observer entirely, not just
    // remove one target.
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={`scroll-reveal ${className}`}>
      {children}
    </div>
  );
}
