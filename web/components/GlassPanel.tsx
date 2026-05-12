"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { type ReactNode, useRef } from "react";

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
  // 3D tilt runs for everyone; the rotation is bounded (±6 deg) so it does
  // not cause vestibular discomfort. Animations are a core part of the
  // product surface here.
  const reduceMotion = false;

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
        background: "var(--panel)",
        borderColor: "var(--panel-border)",
        backdropFilter: "blur(22px) saturate(160%)",
        WebkitBackdropFilter: "blur(22px) saturate(160%)",
        boxShadow:
          "var(--shadow-1), inset 0 1px 0 color-mix(in srgb, var(--text) 6%, transparent)",
      }}
      className={[
        "relative rounded-glass border",
        glow ? "ring-1" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}
