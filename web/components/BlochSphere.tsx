"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { type Mat } from "@/lib/matrix";
import { readThemeToken } from "@/lib/theme";

/** Bloch vector r = (Tr ρX, Tr ρY, Tr ρZ). Pure math, no React. */
function blochVector(rho: Mat): [number, number, number] {
  // 2x2 only. rho[0][1] = a + bi, rho[1][0] = a - bi.
  const rx = 2 * rho[0][1].re;
  const ry = -2 * rho[0][1].im;
  const rz = rho[0][0].re - rho[1][1].re;
  return [rx, ry, rz];
}

interface BlochProps {
  rho: Mat;
  ghost?: Mat | null;
  height?: number;
  caption?: string;
}

export function BlochSphere({ rho, ghost = null, height = 380, caption }: BlochProps) {
  return (
    <div className="qnl-plot-host overflow-hidden rounded-glass" style={{ height, background: "var(--plot-bg)" }}>
      <Canvas camera={{ position: [2.2, 2.2, 1.8], fov: 32 }} dpr={[1, 2]}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 2]} intensity={0.6} />
        <Scene rho={rho} ghost={ghost} />
        <OrbitControls enablePan={false} enableZoom={false} minDistance={2} maxDistance={5} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
      {caption ? (
        <p className="px-4 py-2 text-xs text-ink-dim">{caption}</p>
      ) : null}
    </div>
  );
}

function Scene({ rho, ghost }: { rho: Mat; ghost: Mat | null }) {
  const [colors, setColors] = useState({
    sphere: "rgba(122,162,255,0.18)",
    equator: "rgba(150,170,220,0.55)",
    axis: "rgba(220,220,220,0.55)",
    vector: "#ff9d4d",
    ghost: "rgba(170,170,200,0.7)",
    label: "#e9ecf2",
  });
  useEffect(() => {
    function refresh() {
      setColors({
        sphere: readThemeToken("--bloch-sphere") || colors.sphere,
        equator: readThemeToken("--bloch-equator") || colors.equator,
        axis: readThemeToken("--bloch-axis") || colors.axis,
        vector: readThemeToken("--bloch-vector") || colors.vector,
        ghost: "rgba(170,170,200,0.7)",
        label: readThemeToken("--text") || colors.label,
      });
    }
    refresh();
    document.addEventListener("qnl-theme-change", refresh);
    return () => document.removeEventListener("qnl-theme-change", refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [rx, ry, rz] = blochVector(rho);
  const ghostVec = ghost ? blochVector(ghost) : null;

  return (
    <>
      <mesh>
        <sphereGeometry args={[1, 48, 36]} />
        <meshBasicMaterial color={new THREE.Color(parseAlphaToRGB(colors.sphere))} transparent opacity={0.18} />
      </mesh>
      <SphereWire color={colors.equator} />
      <AxisLines color={colors.axis} />
      <Labels color={colors.label} />
      {ghostVec && <VectorArrow target={ghostVec} color={colors.ghost} dashed />}
      <VectorArrow target={[rx, ry, rz]} color={colors.vector} />
      <mesh position={[rx, ry, rz]}>
        <sphereGeometry args={[0.04, 24, 18]} />
        <meshBasicMaterial color={colors.vector} />
      </mesh>
    </>
  );
}

function VectorArrow({ target, color, dashed = false }: { target: [number, number, number]; color: string; dashed?: boolean }) {
  const ref = useRef<THREE.Line | null>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(...target),
    ]);
    return g;
  }, [target[0], target[1], target[2]]);

  useEffect(() => {
    if (!ref.current) return;
    // ts: drei adds line2 helpers; fall back to native LineBasicMaterial
  }, []);

  // eslint-disable-next-line react/no-unknown-property
  return (
    <line>
      <bufferGeometry attach="geometry" {...geom} />
      {dashed ? (
        <lineDashedMaterial color={color} dashSize={0.08} gapSize={0.05} linewidth={2} />
      ) : (
        <lineBasicMaterial color={color} linewidth={3} />
      )}
    </line>
  );
}

function SphereWire({ color }: { color: string }) {
  // Equator + two great circles.
  const make = (axis: "z" | "x" | "y") => {
    const pts: THREE.Vector3[] = [];
    const n = 80;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      if (axis === "z") pts.push(new THREE.Vector3(Math.cos(t), Math.sin(t), 0));
      if (axis === "x") pts.push(new THREE.Vector3(0, Math.cos(t), Math.sin(t)));
      if (axis === "y") pts.push(new THREE.Vector3(Math.cos(t), 0, Math.sin(t)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  };
  return (
    <group>
      {(["z", "x", "y"] as const).map((axis) => (
        <line key={axis}>
          <bufferGeometry attach="geometry" {...make(axis)} />
          <lineBasicMaterial color={color} />
        </line>
      ))}
    </group>
  );
}

function AxisLines({ color }: { color: string }) {
  const make = (a: [number, number, number], b: [number, number, number]) =>
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  return (
    <group>
      <line>
        <bufferGeometry attach="geometry" {...make([-1.1, 0, 0], [1.1, 0, 0])} />
        <lineBasicMaterial color={color} />
      </line>
      <line>
        <bufferGeometry attach="geometry" {...make([0, -1.1, 0], [0, 1.1, 0])} />
        <lineBasicMaterial color={color} />
      </line>
      <line>
        <bufferGeometry attach="geometry" {...make([0, 0, -1.1], [0, 0, 1.1])} />
        <lineBasicMaterial color={color} />
      </line>
    </group>
  );
}

function Labels({ color }: { color: string }) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group | null>(null);
  useFrame(() => {
    if (groupRef.current) groupRef.current.quaternion.copy(camera.quaternion);
  });
  const labels: Array<[string, [number, number, number]]> = [
    ["|0⟩", [0, 0, 1.2]],
    ["|1⟩", [0, 0, -1.2]],
    ["+x", [1.2, 0, 0]],
    ["−x", [-1.2, 0, 0]],
    ["+y", [0, 1.2, 0]],
    ["−y", [0, -1.2, 0]],
  ];
  return (
    <group ref={groupRef}>
      {labels.map(([text, pos]) => (
        <TextSprite key={text} text={text} position={pos} color={color} />
      ))}
    </group>
  );
}

function TextSprite({ text, position, color }: { text: string; position: [number, number, number]; color: string }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = color;
      ctx.font = "500 32px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, c.width / 2, c.height / 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [text, color]);
  return (
    <sprite position={position} scale={[0.45, 0.22, 1]}>
      <spriteMaterial attach="material" map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

function parseAlphaToRGB(rgba: string): string {
  // Strips alpha so meshBasicMaterial color is correct; opacity is set separately.
  const m = rgba.match(/rgba?\(([^)]+)\)/);
  if (!m) return "#7aa2ff";
  const parts = m[1].split(",").map((s) => s.trim());
  if (parts.length < 3) return "#7aa2ff";
  const [r, g, b] = parts.slice(0, 3).map((s) => Math.round(parseFloat(s)));
  return `rgb(${r}, ${g}, ${b})`;
}
