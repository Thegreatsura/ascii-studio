"use client";
import { ChevronLeft, ChevronRight, Crown } from "@/components/icons/duotone";
import React from "react";
import { motion } from "framer-motion";
import TestimonialCard from "./testimonial-card";
import { TESTIMONIALS } from "./testimonials-data";

const CARD_GAP = 24;
const MAX_CARD_WIDTH = 560;

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = React.useState(0);

  // The track is clipped by the viewport, which shares its width with every
  // other landing section, so cards line up with the layout on both edges.
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setViewportWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cardWidth = viewportWidth
    ? Math.min(MAX_CARD_WIDTH, viewportWidth)
    : MAX_CARD_WIDTH;
  const step = cardWidth + CARD_GAP;
  const visibleCount = viewportWidth
    ? Math.max(1, Math.floor((viewportWidth + CARD_GAP) / step))
    : 1;
  // Stop once the last card reaches the right edge instead of scrolling into
  // empty space.
  const maxIndex = Math.max(0, TESTIMONIALS.length - visibleCount);

  React.useEffect(() => {
    setActiveIndex((p) => Math.min(p, maxIndex));
  }, [maxIndex]);

  const handleNext = () => setActiveIndex((p) => (p + 1) % (maxIndex + 1));
  const handlePrev = () =>
    setActiveIndex((p) => (p - 1 + maxIndex + 1) % (maxIndex + 1));

  return (
    <div className="w-full flex flex-col max-w-[100vw] overflow-hidden text-center justify-center items-center">
      <div className="flex justify-center items-center gap-2 text-xs border-2 border-blue-light-active px-2 py-1 rounded-full">
        <Crown size={16} />
        Testimonials
      </div>
      <span className="text-3xl sm:text-4xl md:text-5xl mt-2">
        Trusted by <br />
        <span
          style={
            {
              background: "linear-gradient(55.33deg, #023CC4 1%, #82AAFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            } as React.CSSProperties
          }
        >
          Twitter Community
        </span>
      </span>

      <div className="mt-14 w-full flex justify-center">
        {/* Width matches every other landing section, so the first card lines
            up with the layout; trailing cards bleed past it and are clipped by
            the section wrapper at the viewport edge. */}
        <div ref={viewportRef} className="landing-content-width">
          <motion.div
            className="flex"
            style={{ gap: `${CARD_GAP}px` }}
            animate={{ x: -activeIndex * step }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 30,
              mass: 0.6,
            }}
          >
            {TESTIMONIALS.map((t, i) => (
              <div
                key={`${t.handle}-${i}`}
                className="shrink-0"
                style={{ width: `${cardWidth}px` }}
              >
                <TestimonialCard
                  name={t.author_name}
                  role={`@${t.handle}`}
                  avatarSrc={t.avatarSrc}
                  content={t.text}
                  tweetUrl={t.tweetUrl}
                  className="h-full"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-10 text-muted-foreground text-xs items-center">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous"
          className="cursor-pointer"
        >
          <ChevronLeft className="hover:text-foreground transition-colors" />
        </button>
        {activeIndex + 1} / {maxIndex + 1}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next"
          className="cursor-pointer"
        >
          <ChevronRight className="hover:text-foreground transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default Testimonials;
