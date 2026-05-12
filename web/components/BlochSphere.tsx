"use client";

import { Billboard, Line, OrbitControls, Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import { type Mat } from "@/lib/matrix";
import { readThemeToken } from "@/lib/theme";

/** Bloch vector r = (Tr ρX, Tr ρY, Tr ρZ). 2×2 only. */
function blochVector(rho: Mat): [number, number, number] {
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
      <Canvas
        camera={{ position: [2.4, 1.6, 2.4], fov: 32, up: [0, 0, 1] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene rho={rho} ghost={ghost} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.55}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI - 0.25}
        />
      </Canvas>
      {caption ? <p className="px-4 py-2 text-xs text-ink-dim">{caption}</p> : null}
    </div>
  );
}

function Scene({ rho, ghost }: { rho: Mat; ghost: Mat | null }) {
  // Resolve theme colors at mount + every theme-change event.
  const [palette, setPalette] = useState(() => readPalette());
  useEffect(() => {
    setPalette(readPalette());
    const refresh = () => setPalette(readPalette());
    document.addEventListener("qnl-theme-change", refresh);
    return () => document.removeEventListener("qnl-theme-change", refresh);
  }, []);

  const [rx, ry, rz] = blochVector(rho);
  const tip = useMemo(() => new THREE.Vector3(rx, ry, rz), [rx, ry, rz]);
  const ghostTip = useMemo(() => {
    if (!ghost) return null;
    const [gx, gy, gz] = blochVector(ghost);
    return new THREE.Vector3(gx, gy, gz);
  }, [ghost]);

  // Latitude rings (around z-axis) at intervals; longitude lines through poles.
  const equator = useMemo(() => circle("z", 1.0, 120), []);
  const longitudeXZ = useMemo(() => circle("y", 1.0, 120), []);
  const longitudeYZ = useMemo(() => circle("x", 1.0, 120), []);
  const latitude30 = useMemo(() => circle("z", Math.cos(Math.PI / 6), 80, Math.sin(Math.PI / 6)), []);
  const latitudeNeg30 = useMemo(() => circle("z", Math.cos(Math.PI / 6), 80, -Math.sin(Math.PI / 6)), []);
  const latitude60 = useMemo(() => circle("z", Math.cos(Math.PI / 3), 60, Math.sin(Math.PI / 3)), []);
  const latitudeNeg60 = useMemo(() => circle("z", Math.cos(Math.PI / 3), 60, -Math.sin(Math.PI / 3)), []);

  return (
    <>
      {/* Lighting — gentle, just enough for the sphere fill. */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 3, 4]} intensity={0.45} />

      {/* Sphere shell — very translucent, gives depth without blocking interior. */}
      <mesh>
        <sphereGeometry args={[1, 64, 48]} />
        <meshPhongMaterial
          color={new THREE.Color(palette.sphere)}
          transparent
          opacity={0.07}
          depthWrite={false}
          shininess={20}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Three great circles + four latitude rings — wireframe scaffolding. */}
      <Line points={equator} color={palette.equator} lineWidth={1.4} transparent opacity={0.85} />
      <Line points={longitudeXZ} color={palette.equator} lineWidth={1.0} transparent opacity={0.55} />
      <Line points={longitudeYZ} color={palette.equator} lineWidth={1.0} transparent opacity={0.55} />
      <Line points={latitude30} color={palette.equator} lineWidth={0.8} transparent opacity={0.28} />
      <Line points={latitudeNeg30} color={palette.equator} lineWidth={0.8} transparent opacity={0.28} />
      <Line points={latitude60} color={palette.equator} lineWidth={0.8} transparent opacity={0.22} />
      <Line points={latitudeNeg60} color={palette.equator} lineWidth={0.8} transparent opacity={0.22} />

      {/* Axis lines through origin. */}
      <Line points={[[-1.15, 0, 0], [1.15, 0, 0]]} color={palette.axis} lineWidth={1.4} transparent opacity={0.65} />
      <Line points={[[0, -1.15, 0], [0, 1.15, 0]]} color={palette.axis} lineWidth={1.4} transparent opacity={0.65} />
      <Line points={[[0, 0, -1.15], [0, 0, 1.15]]} color={palette.axis} lineWidth={1.4} transparent opacity={0.65} />

      {/* Axis end-cap dots so the user can orient even from awkward angles. */}
      <PoleDot position={[0, 0, 1.0]} color={palette.label} />
      <PoleDot position={[0, 0, -1.0]} color={palette.label} />

      {/* Labels — drei <Text> renders crisp SDF text in world space and is
          billboarded via <Billboard>. */}
      {/* Six cardinal states on the Bloch sphere — labeled with their kets
          instead of axis names. */}
      <AxisLabel position={[0, 0, 1.24]} text="|0⟩" color={palette.label} size={0.14} />
      <AxisLabel position={[0, 0, -1.24]} text="|1⟩" color={palette.label} size={0.14} />
      <AxisLabel position={[1.28, 0, 0]} text="|+⟩" color={palette.label} size={0.12} />
      <AxisLabel position={[-1.28, 0, 0]} text="|−⟩" color={palette.label} size={0.12} />
      <AxisLabel position={[0, 1.28, 0]} text="|+i⟩" color={palette.label} size={0.12} />
      <AxisLabel position={[0, -1.28, 0]} text="|−i⟩" color={palette.label} size={0.12} />

      {/* Ghost reference vector (e.g. ρ_initial in Noise / Validation). */}
      {ghostTip && (
        <>
          <Line
            points={[[0, 0, 0], [ghostTip.x, ghostTip.y, ghostTip.z]]}
            color={palette.ghost}
            lineWidth={2}
            dashed
            dashSize={0.07}
            gapSize={0.05}
            transparent
            opacity={0.85}
          />
          <mesh position={[ghostTip.x, ghostTip.y, ghostTip.z]}>
            <sphereGeometry args={[0.038, 24, 18]} />
            <meshBasicMaterial color={palette.ghost} transparent opacity={0.85} />
          </mesh>
        </>
      )}

      {/* Live Bloch vector — thicker line, glowy tip. */}
      <Line
        points={[[0, 0, 0], [tip.x, tip.y, tip.z]]}
        color={palette.vector}
        lineWidth={3.2}
      />
      <mesh position={[tip.x, tip.y, tip.z]}>
        <sphereGeometry args={[0.07, 32, 24]} />
        <meshStandardMaterial
          color={palette.vector}
          emissive={palette.vector}
          emissiveIntensity={0.45}
          roughness={0.35}
          metalness={0.0}
        />
      </mesh>
      {/* Soft halo around the tip. */}
      <mesh position={[tip.x, tip.y, tip.z]}>
        <sphereGeometry args={[0.13, 24, 18]} />
        <meshBasicMaterial color={palette.vector} transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </>
  );
}

function AxisLabel({ position, text, color, size }: { position: [number, number, number]; text: string; color: string; size: number }) {
  return (
    <Billboard position={position}>
      <Text
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="rgba(0,0,0,0.45)"
        outlineOpacity={0.65}
      >
        {text}
      </Text>
    </Billboard>
  );
}

function PoleDot({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.02, 16, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

function circle(axis: "x" | "y" | "z", radius: number, segments = 96, offset = 0): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const c = Math.cos(t) * radius;
    const s = Math.sin(t) * radius;
    if (axis === "z") pts.push([c, s, offset]);
    else if (axis === "x") pts.push([offset, c, s]);
    else pts.push([c, offset, s]);
  }
  return pts;
}

function readPalette() {
  const sphere = readThemeToken("--bloch-sphere") || "rgba(122,162,255,0.18)";
  const equator = readThemeToken("--bloch-equator") || "rgba(150,170,220,0.55)";
  const axis = readThemeToken("--bloch-axis") || "rgba(220,220,220,0.55)";
  const vector = readThemeToken("--bloch-vector") || "#ff9d4d";
  const label = readThemeToken("--text") || "#e9ecf2";
  // For meshBasicMaterial.color we need solid hex (alpha set separately).
  return {
    sphere: stripAlphaToHex(sphere) ?? "#7aa2ff",
    equator: stripAlpha(equator) ?? "#9ab0d8",
    axis: stripAlpha(axis) ?? "#c8c8c8",
    vector: stripAlpha(vector) ?? "#ff9d4d",
    ghost: "#b0b8d0",
    label: stripAlpha(label) ?? "#e9ecf2",
  };
}

function stripAlpha(value: string): string | null {
  if (!value) return null;
  if (value.startsWith("#")) return value;
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return value;
  const parts = match[1].split(",").map((s) => s.trim());
  if (parts.length < 3) return value;
  const [r, g, b] = parts.slice(0, 3).map((s) => Math.round(parseFloat(s)));
  return `rgb(${r}, ${g}, ${b})`;
}

function stripAlphaToHex(value: string): string | null {
  const rgb = stripAlpha(value);
  if (!rgb) return null;
  if (rgb.startsWith("#")) return rgb;
  const match = rgb.match(/rgb\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(",").map((s) => parseInt(s.trim(), 10));
  if (parts.length < 3) return null;
  const [r, g, b] = parts;
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
