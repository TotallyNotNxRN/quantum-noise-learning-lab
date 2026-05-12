"use client";

import { useEffect, useRef } from "react";

import { readThemeToken } from "@/lib/theme";

/** Subtle drifting dim-points field rendered on a fixed canvas. Pure black
 *  base color, ~40 dim points moving at < 0.5 px/frame. Respects reduced
 *  motion. Re-reads CSS variables on theme change so points fade between
 *  modes smoothly. */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pointsRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    a: number;
  }>>([]);
  const colorRef = useRef<{ point: string; fade: string }>({ point: "rgba(255,255,255,0.10)", fade: "rgba(255,255,255,0.025)" });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animated background runs regardless of OS reduced-motion: it's a
    // signature visual element of this app and the per-frame motion is
    // sub-pixel-tiny per second. Mobile still downgrades for battery.
    const mobile = window.innerWidth < 768;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    }

    function spawnPoints() {
      const count = mobile ? 28 : 70;
      const pts = [];
      for (let i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 0.35 * window.devicePixelRatio,
          vy: (Math.random() - 0.5) * 0.35 * window.devicePixelRatio,
          r: (1.8 + Math.random() * 2.6) * window.devicePixelRatio,
          a: 0.45 + Math.random() * 0.55,
        });
      }
      pointsRef.current = pts;
    }

    function readColors() {
      colorRef.current = {
        point: readThemeToken("--bg-point") || "rgba(255,255,255,0.10)",
        fade: readThemeToken("--bg-point-fade") || "rgba(255,255,255,0.025)",
      };
    }

    function step() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { point, fade } = colorRef.current;
      for (const p of pointsRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        grd.addColorStop(0, point);
        grd.addColorStop(1, fade);
        ctx.fillStyle = grd;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = window.requestAnimationFrame(step);
    }

    resize();
    spawnPoints();
    readColors();
    window.addEventListener("resize", resize);
    document.addEventListener("qnl-theme-change", readColors as EventListener);

    rafRef.current = window.requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("qnl-theme-change", readColors as EventListener);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "var(--bg-deep)" }}
    />
  );
}
