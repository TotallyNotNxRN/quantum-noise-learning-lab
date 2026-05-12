"use client";

import { useEffect, useRef } from "react";

/** Animated cursor: a small dot that tracks the pointer exactly, plus a ring
 *  that follows with spring damping. Single follower, not a multi-dot trail.
 *  Disabled on touch / coarse-pointer devices so it does not interfere with
 *  the native tap target. */
export function AnimatedCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let visible = false;
    let hovering = false;

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        if (dot) dot.style.opacity = "1";
        if (ring) ring.style.opacity = "1";
      }
    }
    function onLeave() {
      visible = false;
      if (dot) dot.style.opacity = "0";
      if (ring) ring.style.opacity = "0";
    }
    function onOver(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      hovering = !!t?.closest("a, button, [role=button], summary, label");
      if (ring) ring.dataset.hover = hovering ? "1" : "0";
    }

    function step() {
      // Spring trail on the ring.
      const k = 0.18;
      rx += (mx - rx) * k;
      ry += (my - ry) * k;
      if (dot) dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${hovering ? 1.45 : 1})`;
      rafRef.current = window.requestAnimationFrame(step);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) onLeave();
    });
    document.addEventListener("mouseover", onOver);
    rafRef.current = window.requestAnimationFrame(step);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="qnl-cursor-dot"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 100,
          mixBlendMode: "difference",
          willChange: "transform",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="qnl-cursor-ring"
        data-hover="0"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid var(--accent)",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 99,
          mixBlendMode: "difference",
          transition: "transform 220ms cubic-bezier(.2,.8,.2,1), border-color 200ms ease, opacity 200ms ease",
          willChange: "transform",
        }}
      />
    </>
  );
}
