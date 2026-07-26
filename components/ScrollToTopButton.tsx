"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopButtonProps {
  /** Scroll offset (px) after which the button appears. */
  threshold?: number;
}

export function ScrollToTopButton({ threshold = 480 }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      className={`fixed bottom-6 right-6 z-40 flex items-center justify-center w-11 h-11 rounded-full
                  bg-white border border-border text-primary shadow-lg
                  transition-all duration-300 ease-out
                  hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/30 hover:bg-primary/5
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                  ${visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"}`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

export default ScrollToTopButton;
