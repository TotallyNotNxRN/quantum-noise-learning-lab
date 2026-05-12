"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: boolean;
}

/** 3D-tilt glass panel. Mouse position relative to the panel center rotates
 *  it via spring-eased X/Y rotations and lifts it on Z. Disables tilt on
 *  prefers-reduced-motion or when `tilt={false}` is passed (e.g. for charts
 *  inside that already capture pointer events). */
export function GlassPanel({ children, className, tilt = true, glow = false }: GlassPanelProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const lift = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 220, damping: 18 });
  const springY = useSpring(rotY, { stiffness: 220, damping: 18 });
  const springLift = useSpring(lift, { stiffness: 220, damping: 22 });

  const xDeg = useTransform(springY, (v) => `${v}deg`);
  const yDeg = useTransform(springX, (v) => `${-v}deg`);
  const zPx = useTransform(springLift, (v) => `${v}px`);

  function onMove(ev: React.MouseEvent<HTMLDivElement>) {
    if (!tilt || reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (ev.clientX - cx) / rect.width;
    const ny = (ev.clientY - cy) / rect.height;
    rotY.set(nx * 6);
    rotX.set(ny * 6);
    lift.set(8);
  }

  function onLeave() {
    rotX.set(0);
    rotY.set(0);
    lift.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transformPerspective: 1200,
        rotateX: yDeg,
        rotateY: xDeg,
        z: zPx,
      }}
      className={[
        "relative rounded-glass border border-panel-border bg-panel",
        "backdrop-blur-md shadow-glass",
        glow ? "ring-1 ring-accent/15" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}
