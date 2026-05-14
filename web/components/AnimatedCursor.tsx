"use client";

import { useEffect, useRef } from "react";

/** Animated cursor — two-state.
 *
 * Idle (no hover): small dot at exact pointer + faded ring trailing.
 * Hover (over a, button, [role=button], summary, label):
 *   - center dot fades out
 *   - ring scales 1.5x and grows four "+" tick marks at N/S/E/W
 *
 * Single follower; not a multi-dot trail. Disabled on coarse pointers. */
export function AnimatedCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let hovering = false;
    let visible = false;

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        dot!.style.opacity = "1";
        ring!.style.opacity = "1";
      }
    }
    function onLeave(e: MouseEvent) {
      if (!e.relatedTarget) {
        visible = false;
        dot!.style.opacity = "0";
        ring!.style.opacity = "0";
      }
    }
    function onOver(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      // Treat plot containers + canvases as interactive too, so the centre
      // dot fades out and the ring + plus ticks show instead. Keeps the
      // amber dot from punching through dense Plotly/recharts/heatmap fills.
      const interactive = !!t?.closest(
        'a, button, [role="button"], summary, label, input[type="range"], ' +
        '.qnl-plot-host, canvas, svg',
      );
      if (interactive !== hovering) {
        hovering = interactive;
        ring!.dataset.hover = hovering ? "1" : "0";
        dot!.dataset.hover = hovering ? "1" : "0";
      }
    }

    function step() {
      // Spring lerp on the ring; dot tracks exactly.
      const k = 0.22;
      rx += (mx - rx) * k;
      ry += (my - ry) * k;
      dot!.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      ring!.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      rafRef.current = window.requestAnimationFrame(step);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);
    document.addEventListener("mouseover", onOver, { passive: true });
    rafRef.current = window.requestAnimationFrame(step);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      document.removeEventListener("mouseover", onOver);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        data-hover="0"
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
          zIndex: 1001,
          mixBlendMode: "difference",
          willChange: "transform, opacity",
          transition: "opacity 160ms ease",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        data-hover="0"
        className="qnl-cursor-ring"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          opacity: 0,
          pointerEvents: "none",
          zIndex: 1000,
          mixBlendMode: "difference",
          willChange: "transform",
          transition:
            "transform 220ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease",
        }}
      >
        {/* The ring itself */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid var(--accent)",
          }}
        />
        {/* Four plus tick marks at N / S / E / W — only visible on hover. */}
        <Tick orientation="n" />
        <Tick orientation="s" />
        <Tick orientation="e" />
        <Tick orientation="w" />
      </div>
      <style jsx global>{`
        .qnl-cursor-dot[data-hover="1"] {
          opacity: 0 !important;
        }
        .qnl-cursor-ring[data-hover="1"] {
          transform: translate3d(var(--x, 0), var(--y, 0), 0) translate(-50%, -50%) scale(1.5);
        }
        .qnl-cursor-tick {
          position: absolute;
          background: var(--accent);
          opacity: 0;
          transition: opacity 200ms ease;
          width: 2px;
          height: 6px;
          border-radius: 1px;
        }
        .qnl-cursor-ring[data-hover="1"] .qnl-cursor-tick {
          opacity: 1;
        }
      `}</style>
    </>
  );
}

function Tick({ orientation }: { orientation: "n" | "s" | "e" | "w" }) {
  const base: React.CSSProperties = {
    position: "absolute",
    background: "var(--accent)",
    width: 2,
    height: 6,
    borderRadius: 1,
  };
  if (orientation === "n") return <span className="qnl-cursor-tick" style={{ ...base, top: -8, left: "50%", transform: "translateX(-50%)" }} />;
  if (orientation === "s") return <span className="qnl-cursor-tick" style={{ ...base, bottom: -8, left: "50%", transform: "translateX(-50%)" }} />;
  if (orientation === "e") return <span className="qnl-cursor-tick" style={{ ...base, right: -8, top: "50%", width: 6, height: 2, transform: "translateY(-50%)" }} />;
  return <span className="qnl-cursor-tick" style={{ ...base, left: -8, top: "50%", width: 6, height: 2, transform: "translateY(-50%)" }} />;
}
