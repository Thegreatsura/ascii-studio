"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const AsciiBackground = () => {
  const [dots, setDots] = useState<{ x: number, y: number, char: string }[]>([]);

  useEffect(() => {
    const chars = ".-+*=%#@".split("");
    const newDots = [];
    for (let i = 0; i < 50; i++) {
      newDots.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        char: chars[Math.floor(Math.random() * chars.length)],
      });
    }
    setDots(newDots);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* ASCII Particles */}
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute text-[10px] text-foreground/20 font-mono"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {dot.char}
        </motion.div>
      ))}

      {/* Decorative Grid Markers (Primary Theme Color) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-full h-full max-w-7xl max-h-[800px] border-x border-y border-border relative">
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-sm" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-sm" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-sm" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-sm" />
            
            <div className="absolute top-1/2 -left-1 w-1 h-8 bg-primary/50 -translate-y-1/2" />
            <div className="absolute top-1/2 -right-1 w-1 h-8 bg-primary/50 -translate-y-1/2" />
        </div>
      </div>

      {/* Radial Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
    </div>
  );
};
