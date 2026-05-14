"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Three-phase intro played once per browser session (sessionStorage gate):
 *   1. Liquid pour: a black panel slides down from the top, fills the
 *      viewport in ~600 ms.
 *   2. Bloch materialise: while the panel holds, a wireframe Bloch sphere
 *      assembles at the center — center dot → vector → ring → equator.
 *   3. Reveal: the panel slides further down out of view, taking the
 *      Bloch with it, and the underlying content fades up.
 *  Total: ~1.8 s. Skippable by clicking anywhere. */
export function OpeningAnimation() {
  const [active, setActive] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("qnl-intro-played");
      if (seen === "1") {
        setActive(false);
        return;
      }
      setActive(true);
      sessionStorage.setItem("qnl-intro-played", "1");
    } catch {
      setActive(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(false), 1900);
    return () => window.clearTimeout(t);
  }, [active]);

  if (active === null || active === false) return null;

  const ease = [0.2, 0.8, 0.2, 1] as const;

  return (
    <AnimatePresence>
      <motion.div
        key="qnl-intro"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={() => setActive(false)}
        aria-hidden
        className="fixed inset-0 z-[200] cursor-pointer overflow-hidden"
      >
        {/* PHASE 1 — liquid pour: a black wall slides down from above. */}
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: ["-100%", "0%", "0%", "100%"] }}
          transition={{ duration: 1.8, times: [0, 0.32, 0.78, 1.0], ease }}
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #000 0%, #050505 60%, #0a0a0a 100%)",
          }}
        />
        {/* Surface tension highlight at the leading edge of the pour. */}
        <motion.div
          initial={{ y: "-100%", opacity: 1 }}
          animate={{ y: ["-100%", "0%", "0%", "100%"], opacity: [1, 1, 0.55, 0] }}
          transition={{ duration: 1.8, times: [0, 0.32, 0.78, 1.0], ease }}
          className="absolute inset-x-0 h-[6px]"
          style={{
            top: 0,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.55) 60%, rgba(251,191,36,0) 100%)",
            filter: "blur(2px)",
          }}
        />

        {/* PHASES 2-3 — Bloch wireframe assembles, then dissolves with the pour. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.9, 0.95, 1.0, 1.0, 1.05] }}
          transition={{ duration: 1.8, times: [0, 0.35, 0.55, 0.78, 1.0], ease }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <BlochAssemble />
        </motion.div>

        {/* Wordmark fades in alongside the sphere. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, -8] }}
          transition={{ duration: 1.8, times: [0, 0.4, 0.6, 0.78, 1.0], ease }}
          className="absolute inset-x-0 bottom-[26%] flex flex-col items-center gap-1 text-center"
        >
          <span
            className="font-serif text-2xl tracking-tight md:text-3xl"
            style={{ color: "#f5f5f4" }}
          >
            Quantum Noise Lab
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.22em]"
            style={{ color: "#a8a29e" }}
          >
            single-qubit · decoherence
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function BlochAssemble() {
  const stroke = "#f5f5f4";
  const accent = "#fbbf24";
  const draw = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
  };
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
      {/* Equator */}
      <motion.ellipse
        cx="110"
        cy="110"
        rx="78"
        ry="26"
        stroke={stroke}
        strokeWidth="1.4"
        strokeOpacity="0.55"
        variants={draw}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
      />
      {/* Outer ring */}
      <motion.circle
        cx="110"
        cy="110"
        r="78"
        stroke={stroke}
        strokeWidth="1.6"
        variants={draw}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.55, delay: 0.55, ease: "easeOut" }}
      />
      {/* Vector */}
      <motion.line
        x1="110"
        y1="110"
        x2="162"
        y2="62"
        stroke={accent}
        strokeWidth="2.6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.75, ease: "easeOut" }}
      />
      {/* Vector tip */}
      <motion.circle
        cx="162"
        cy="62"
        r="6"
        fill={accent}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.0, ease: "easeOut" }}
      />
      {/* Center dot */}
      <motion.circle
        cx="110"
        cy="110"
        r="3"
        fill={stroke}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25, delay: 0.4, ease: "easeOut" }}
      />
    </svg>
  );
}
