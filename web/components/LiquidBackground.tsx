"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/** Glossy flowing-oil background. Smooth wide wave bands flow horizontally
 *  with low-frequency vertical curl warp; bright specular ribbons trace
 *  the crests. Dark mode = polished black oil; light mode = white cream. */
export function LiquidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Canvas
        gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1, near: 0, far: 2 }}
      >
        <FullscreenQuad />
      </Canvas>
    </div>
  );
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Smooth, low-frequency flowing oil. Stack of broad horizontal wave bands
// whose vertical positions are warped by very slow noise -> visible long
// curling currents. Specular highlight via analytic gradient. No grain.
const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform float uMode; // 0 dark, 1 light

// -------- 2D simplex (Ashima / Ian McEwan, public domain) -------------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 2 octaves only -> stays smooth, no grain.
float smoothNoise(vec2 p) {
  return snoise(p) * 0.65 + snoise(p * 2.05 + 7.3) * 0.35;
}

// Liquid height = sum of three broad wave bands. Each band:
//   1. flows horizontally at its own speed,
//   2. vertical position is warped by very slow smoothNoise,
//   3. has its own frequency / phase.
float liquid(vec2 p, float t) {
  // Warp the vertical coord so the bands curl rather than running straight.
  float warp = smoothNoise(p * vec2(0.6, 0.4) + vec2(t * 0.05, t * 0.02)) * 0.85;

  float band1 = sin((p.y + warp) * 1.6 + p.x * 0.45 + t * 0.55);
  float band2 = sin((p.y + warp * 1.35) * 2.6 - p.x * 0.25 + t * 0.42 + 1.7);
  float band3 = sin((p.y + warp * 0.7) * 4.2 + p.x * 0.15 + t * 0.32 + 3.4);

  return band1 * 0.55 + band2 * 0.30 + band3 * 0.18;
}

void main() {
  // Aspect-correct UVs, lightly scaled.
  vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  uv *= 1.8;

  float t = uTime;
  float h = liquid(uv, t);

  // Analytic finite-difference gradient -> fake surface normal.
  float eps = 0.012;
  float hx = liquid(uv + vec2(eps, 0.0), t);
  float hy = liquid(uv + vec2(0.0, eps), t);
  vec2 grad = vec2(hx - h, hy - h) / eps;
  vec3 N = normalize(vec3(-grad * 1.4, 1.0));

  // Fixed light coming from upper-left, slightly out of screen.
  vec3 L = normalize(vec3(-0.55, 0.65, 0.7));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float diff = clamp(dot(N, L), 0.0, 1.0);

  // -------- Dark mode: oil-black plus very sharp white ribbons --------
  // Multi-tier specular: a wide sheen on the slopes, plus a piercing
  // pinhead specular on the crests. Combined they read as wet glossy
  // oil with bright reflective highlights -- not matte latex.
  float specSharp = pow(clamp(dot(N, H), 0.0, 1.0), 220.0);   // pinhead
  float specWide  = pow(clamp(dot(N, H), 0.0, 1.0), 28.0);    // sheen
  float specHalo  = pow(clamp(dot(N, H), 0.0, 1.0), 8.0);     // soft glow

  vec3 dark = vec3(0.0035);
  // Deepen the valleys so the highs pop harder.
  dark += vec3(0.02) * pow(smoothstep(-1.0, 1.0, h), 1.6);
  dark += vec3(0.06) * pow(diff, 2.4);
  dark += vec3(1.6)  * specSharp;   // very bright thin ribbon
  dark += vec3(0.45) * specWide;    // sheen on slopes
  dark += vec3(0.10) * specHalo;    // glow under the highlights

  // -------- Light mode: cream oil with deep amber-shadow valleys ------
  vec3 light = vec3(0.97);
  light -= vec3(0.22) * pow(smoothstep(-1.0, 1.0, h), 1.4);
  light -= vec3(0.28) * (1.0 - pow(diff, 1.5));
  light += vec3(0.04) * specSharp;
  light = clamp(light, 0.0, 1.0);

  vec3 col = mix(dark, light, uMode);

  // Soft vignette so the edges roll into shadow / fade.
  float vig = 1.0 - smoothstep(0.5, 1.35, length(uv * vec2(0.85, 1.0)));
  col *= mix(0.4 + 0.6 * vig, 0.88 + 0.12 * vig, uMode);

  gl_FragColor = vec4(col, 1.0);
}
`;

function FullscreenQuad() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const mode = useThemeMode();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMode: { value: mode },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uMode.value = mode;
  }, [mode]);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    const size = state.size;
    matRef.current.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function useThemeMode(): number {
  const [mode, setMode] = useState<number>(0);
  useEffect(() => {
    function read() {
      const t = document.documentElement.getAttribute("data-theme");
      setMode(t === "light" ? 1 : 0);
    }
    read();
    document.addEventListener("qnl-theme-change", read);
    return () => document.removeEventListener("qnl-theme-change", read);
  }, []);
  return mode;
}
