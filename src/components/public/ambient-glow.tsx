"use client";

import { motion } from "framer-motion";

export function AmbientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Primary Gold Orb */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-[40rem] w-[40rem] rounded-full bg-csk-gold/10 blur-[120px]"
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -50, 100, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Secondary Accent Orb */}
      <motion.div
        className="absolute right-1/4 top-1/2 h-[30rem] w-[30rem] rounded-full bg-csk-goldLight/5 blur-[100px]"
        animate={{
          x: [0, -80, 40, 0],
          y: [0, 60, -80, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Dark Depth Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]" />
    </div>
  );
}
