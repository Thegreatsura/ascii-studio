"use client";
import { ChevronLeft, ChevronRight, Crown } from "@/components/icons/duotone";
import React from "react";
import { motion } from "framer-motion";
import TestimonialCard from "./testimonial-card";
import { TESTIMONIALS } from "./testimonials-data";

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [cardWidth, setCardWidth] = React.useState(560);
  const cardGap = 24;

  React.useEffect(() => {
    const update = () => {
      setCardWidth(
        window.innerWidth < 640 ? Math.round(window.innerWidth * 0.88) : 560,
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleNext = () => setActiveIndex((p) => (p + 1) % TESTIMONIALS.length);
  const handlePrev = () =>
    setActiveIndex((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

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
        <div className="w-245 max-w-[92vw]">
          <motion.div
            className="flex"
            style={{ gap: `${cardGap}px` }}
            animate={{ x: -activeIndex * (cardWidth + cardGap) }}
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
        {activeIndex + 1} / {TESTIMONIALS.length}
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
