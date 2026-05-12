# Quantum Noise Learning Lab — V2 architecture (Next.js)

Status: spec locked. Awaiting Codex adversarial-review before scaffold.

## Why a pivot

Streamlit cannot deliver these user requirements:

1. **Page-to-page transitions** (crossfade / slide between routes).
2. **Smooth animated theme swap** (CSS-variable interpolation on click).
3. **Custom cursor with consistent behaviour** across the app.
4. **3D-popping glass panels** with perspective + lift.
5. **Pixel-controlled animated black background** (oily waves OR slow dim points).

Multi-page Streamlit reloads each page as a fresh HTML document; you cannot animate between them. Plotly + Streamlit's React shadow tree also fights custom CSS via DOMPurify.

## New stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **Next.js 15 (app router)** | SPA route transitions via Framer Motion; first-class Vercel deploy. |
| Styling | **Tailwind CSS 4** + CSS variables | Theme tokens, dark/light morph, glass utilities. |
| Animation | **Framer Motion** | `AnimatePresence`, layout animations, scroll-driven transforms. |
| 3D | **react-three-fiber + drei** | Bloch sphere as a proper WebGL scene, runs at 60 fps. |
| 2D plots | **recharts** (light) + custom SVG heatmaps | Recharts for line/bar; SVG for density-matrix heatmaps so we control styling fully. |
| Math | **TypeScript port** of the Python engine | No backend → no cold start → static Vercel deploy. |
| Tests | **Vitest** | Mirrors `tests/test_*.py` with the same assertions (port parity). |
| Deploy | **Vercel (static)** | One click. Github → Vercel auto-deploys main. |

Python engine in `src/quantum_noise_lab/` **stays** as the canonical reference. `pytest` keeps running so any TS-port drift is caught against the same numerical truths.

## Directory layout

```
quantum-noise-learning-lab/
├── README.md                         (rewritten)
├── LICENSE
├── PLAN.md                           (kept, archived)
├── PLAN_V2.md                        (this)
├── pyproject.toml                    (Python reference)
├── requirements.txt
├── src/quantum_noise_lab/            (Python reference engine — unchanged)
├── tests/                            (Python reference tests — unchanged)
├── docs/                             (math write-ups)
├── examples/                         (Python figure generators)
├── web/                              (NEXT.JS APP)
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── vitest.config.ts
│   ├── app/
│   │   ├── layout.tsx                (root shell, theme, animated bg, transitions)
│   │   ├── globals.css
│   │   ├── page.tsx                  (landing)
│   │   ├── foundations/page.tsx
│   │   ├── noise/page.tsx
│   │   ├── metrics/page.tsx
│   │   ├── validation/page.tsx
│   │   └── protection/page.tsx
│   ├── components/
│   │   ├── Logo.tsx                  (custom SVG, see "Logo" below)
│   │   ├── AnimatedBackground.tsx    (canvas dim-points field, ~40 pts, 1 fps drift)
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggle.tsx           (animated dot slider)
│   │   ├── PageTransition.tsx        (AnimatePresence + motion wrappers)
│   │   ├── OpeningAnimation.tsx      (logo→title staggered fade-in on first load)
│   │   ├── GlassPanel.tsx            (3D-tilt-on-mouse, perspective(1200px) + glow)
│   │   ├── Navigation.tsx            (top + side, animated link underline)
│   │   ├── BlochSphere.tsx           (R3F Canvas: sphere, axes, equator, vector, drag-rotate)
│   │   ├── DensityMatrixHeatmap.tsx  (SVG-based; controlled colors)
│   │   ├── ProbabilityBar.tsx
│   │   ├── MetricCurve.tsx
│   │   ├── EigenvalueBar.tsx
│   │   ├── KrausOperatorBlock.tsx
│   │   ├── ValidationPill.tsx
│   │   ├── BeginnerBox.tsx
│   │   └── TechnicalBox.tsx          (renders LaTeX via KaTeX)
│   ├── lib/
│   │   ├── complex.ts                (Complex type + ops)
│   │   ├── matrix.ts                 (NxN matrix ops, eigh via Jacobi)
│   │   ├── states.ts                 (port of states.py)
│   │   ├── noise.ts                  (port of noise.py)
│   │   ├── metrics.ts                (port of metrics.py)
│   │   ├── analytical.ts             (port of analytical.py)
│   │   ├── qec.ts                    (port of qec.py)
│   │   ├── sweeps.ts                 (port of sweeps.py)
│   │   ├── theme.ts                  (token table, CSS-variable export)
│   │   └── modules.ts                (module metadata for nav + landing cards)
│   ├── __tests__/
│   │   ├── states.test.ts
│   │   ├── noise.test.ts
│   │   ├── metrics.test.ts
│   │   ├── analytical.test.ts
│   │   ├── qec.test.ts
│   │   └── parity.test.ts            (sanity-check numerical values against Python expected snapshots)
│   └── public/
│       ├── favicon.svg               (the logo)
│       └── og-image.png              (optional, can defer)
├── vercel.json                       (root: deploys web/)
└── .gitignore                        (add node_modules/, .next/, etc.)
```

Legacy `app/`, `.streamlit/`, `launch.bat`, `launch.ps1` will be removed in this pass — they conflict with the new flagship UI.

## TypeScript engine — port plan

The Python engine is 7 files, all small. The TS port mirrors the API one-to-one:

| Python module | TS module | Notes |
|---|---|---|
| `states.py` | `lib/states.ts` | `ketZero`, `ketOne`, `plusState`, `customQubitState`, `densityMatrix`, `tensorProduct`. |
| `noise.py` | `lib/noise.ts` | `amplitudeDampingKraus`, `phaseDampingKraus` (random-Z form), `depolarizingKraus` (N&C 4-op), `applyKrausChannel`, `krausCompletenessResidual`. |
| `metrics.py` | `lib/metrics.ts` | `fidelity` (squared Uhlmann + pure-ket fast path), `purity`, `eigenvalues` (Jacobi for 2×2 Hermitian), `traceValue`, `isHermitian`, `isPSD`, `isValidDensityMatrix`. |
| `analytical.py` | `lib/analytical.ts` | Closed forms; identical formulas, identical conventions. |
| `qec.py` | `lib/qec.ts` | `1 - p`, `(1 - p)^3 + 3p(1 - p)^2`. |
| `sweeps.py` | `lib/sweeps.ts` | Same shape, returns arrays. |

Same input-validation contract: out-of-range params throw `Error`; non-Hermitian or non-PSD rho rejected.

Vitest tests mirror the Python tests so parity is provable.

## UI primitives

### `AnimatedBackground`

Canvas overlay, `position: fixed; inset: 0; z-index: -1; pointer-events: none`. ~40 dim points, each:
- Initial random `(x, y)` and small drift velocity.
- Rendered as a 1.5–3 px radius filled circle, `rgba(255,255,255,0.06–0.12)`.
- Every 16 ms reposition by `vx, vy * 0.04` (slow). On wall hit, soft bounce.
- Pure black backdrop `#000` behind. No purple, no gradient.

### Cursor

**Removed cursor trail per user request.** Default cursor everywhere except:
- Plot regions inherit `cursor: crosshair` (matches old "zoom box" feel).
- Slider thumbs `cursor: ew-resize`.

No custom dot-and-ring tracking element.

### `GlassPanel`

Wrapper `div` with:
- `backdrop-filter: blur(20px) saturate(140%)`.
- `background: var(--panel)` (semi-transparent dark in dark, near-white in light).
- `border: 1px solid var(--panel-border)`.
- `box-shadow: 0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)`.
- **3D tilt on hover/mouse**: `transform: perspective(1200px) rotateX(α) rotateY(β) translateZ(8px)` where α/β are computed from `(mouseX, mouseY)` relative to panel center via `framer-motion`'s `useMotionValue` + `useTransform`. Returns to flat on `mouseleave` via spring.

### `PageTransition`

`AnimatePresence mode="wait"` wrapping `<motion.div>` in `app/layout.tsx`:
- `initial = { opacity: 0, y: 12, filter: "blur(8px)" }`
- `animate = { opacity: 1, y: 0, filter: "blur(0px)" }`
- `exit = { opacity: 0, y: -8, filter: "blur(6px)" }`
- 360 ms ease-out.

### `OpeningAnimation`

Triggers on first paint of `/` only (stored in `sessionStorage`):
- Logo enters with `scale 0.6 → 1`, `opacity 0 → 1`, 600 ms.
- Title fades up 80 ms after.
- Module cards stagger 60 ms each.

### `ThemeProvider` + `ThemeToggle`

CSS variables on `<html data-theme="dark|light">`. Switch swaps the attribute. Tailwind reads via `[data-theme="dark"]` parent selector.

Animation: all theme-driven utilities use `transition: background 400ms ease, color 400ms ease, border-color 400ms ease`. Result: clicking the toggle smoothly morphs panel colors, text, accents without page reload.

**Light mode contrast fix:** light-mode panels use solid `rgba(255,255,255,0.96)` background (not 0.6) + text `#1c2030` for ≥AA contrast over the white-on-dim-points backdrop.

### Logo

Hand-built SVG. Concept: a stylized Bloch sphere — a circle outline with a small orange dot at the tip of a vector, sitting inside a soft halo. Monogram-style. ~28 px square, scales to any size.

```
       __
     ./  \.
    |  •  |   <- orange vector tip
    | /   |
     \___/
```

Single-color stroke (current theme accent), accent dot, no fill. Pairs with wordmark "Quantum Noise Lab" in Newsreader serif.

### Navigation

Top bar: logo + wordmark left; light/dark toggle right; sidebar collapsed link list (Foundations / Noise / Metrics / Validation / Protection) with animated underline on active.

### Slider labels

Per channel, the slider label is rewritten dynamically:
- Amplitude damping: `γ — decay probability`
- Phase damping: `λ — dephasing strength`
- Depolarizing: `p — depolarizing rate`

Symbol shown next to the numeric value live.

## Plotly removal

Plotly is dropped from the new UI:
- Heatmaps: hand-rendered SVG so colors and tooltips match the dark theme exactly.
- Curves: `recharts` (lighter, theme-aware).
- Bloch sphere: `react-three-fiber` (real WebGL, smooth, no overflow bugs).

This kills the "chart exceeds column" bug from the screenshots — every chart sizes through Tailwind grid, not via a JS injected DOM that fights its container.

## Deployment

- `vercel.json` at the repo root maps `web/` as the project root.
- Push to `main` → Vercel auto-deploys.
- Build command: `cd web && npm install && npm run build`.
- Output: `web/.next` (Vercel autodetects).
- No environment variables required (math is fully client-side).

## Out of scope (this pass)

- Backend / FastAPI — not needed; math is in TS.
- True page transitions between very different routes that share NO layout — keep page mount animation per route as the minimum.
- Cursor trail — explicitly removed.
- Particle backgrounds beyond ~40 dim points — explicitly capped.
- Multi-qubit — still single-qubit scope.

## Parity contract (Codex blocker resolution)

The TS engine is gated by Python-generated reference fixtures. The Python
script `tests/generate_parity_fixtures.py` writes `web/__tests__/parity_fixtures.json`
containing, for each public function, a dense grid of inputs paired with
the Python-produced output. Vitest's `parity.test.ts` reads the fixture
and asserts the TS output matches with these explicit tolerances:

- Complex matrices: every entry `|sim.re - ref.re| ≤ 1e-12` AND `|sim.im - ref.im| ≤ 1e-12`.
- Scalars (fidelity, purity, eigenvalues, residual): `|sim - ref| ≤ 1e-12`.
- Boolean validators: identical truth values.
- ValueError paths: every Python `ValueError` case must produce a thrown JS `Error` with a non-empty message.

Coverage required before TS engine is considered done:
- Amplitude / phase / depolarizing channels on `{|0>, |1>, |+>}` at `param ∈ {0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0}` — outputs and Kraus completeness residual.
- Fidelity vs `|+>` for all three channels on the same param grid (matches squared Uhlmann).
- Eigenvalues at pure-state and maximally-mixed cases plus three intermediate cases.
- Analytical formulas: rho_AD, rho_PD, F_AD, F_PD on `linspace(0, 1, 11)`.
- QEC formulas on `linspace(0, 1, 11)`.

The fixture file is committed; the Python script can be re-run to refresh it.

## Vercel deployment contract (Codex risk resolution)

Vercel project settings (Dashboard, NOT vercel.json, because rootDirectory
must be set there):
- Root Directory: `web`
- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: (default — Next.js)
- Node.js version: 20.x

No `vercel.json` is required if the dashboard fields are set correctly. A
`vercel.json` with only `{"framework":"nextjs"}` is added for hint clarity.

Local dry-run gate before push:
- `cd web && npm run build` must succeed with exit 0.
- `cd web && npm run start` must serve all 5 routes returning 200.

## Animation budget + reduced-motion (Codex risk resolution)

`AnimatedBackground`, `PageTransition`, `GlassPanel` tilt, and the
`OpeningAnimation` ALL check `window.matchMedia('(prefers-reduced-motion: reduce)')`
on mount. If set:
- `AnimatedBackground` renders the static field at 0 fps (no rAF loop) or skips entirely.
- `PageTransition` skips the blur/translate; only opacity 0→1 at 120 ms.
- `GlassPanel` skips the 3D tilt entirely; only static drop shadow.
- `OpeningAnimation` is bypassed; content appears instantly.

Mobile gate: `window.innerWidth < 768`:
- `BlochSphere` falls back to a 2D SVG projection (still shows the vector,
  no 3D rotation).
- `AnimatedBackground` drops to ~15 points and increases interval to 33 ms.

Bundle gate (enforced manually on first build):
- First-load JS for landing route: target < 220 kB gzip.
- First-load JS for any module route: target < 320 kB gzip (R3F included).
- If exceeded: dynamic-import the Bloch sphere via `next/dynamic({ ssr: false })`.

## KaTeX rendering contract (Codex risk resolution)

Equations are rendered server-side at build time:
- `TechnicalBox` and inline math use `katex.renderToString(latex, { throwOnError: false, displayMode })`.
- The HTML output is inserted via `dangerouslySetInnerHTML` only from string literals controlled by the source files (no user-supplied input ever reaches KaTeX).
- `katex/dist/katex.min.css` is imported once in `app/layout.tsx`.
- `__tests__/katex.test.ts` snapshots the rendered HTML for every equation in the app — drift surfaces in code review.
- Theme contrast verified manually on dark + light for every equation block.

## Theme contract (Codex risk resolution)

Single source of truth: `lib/theme.ts` exports a `TOKENS` map. `globals.css`
declares every CSS variable on both `[data-theme="dark"]` and
`[data-theme="light"]`:

- Surfaces: `--bg`, `--bg-deep`, `--panel`, `--panel-border`, `--panel-strong`.
- Text: `--text`, `--text-dim`, `--text-accent`.
- Accents: `--accent`, `--accent-2`, `--good`, `--warn`, `--bad`.
- Plots: `--plot-bg`, `--plot-grid`, `--plot-line`, `--plot-line-2`, `--heatmap-pos`, `--heatmap-neg`, `--heatmap-mid`.
- 3D: `--bloch-sphere`, `--bloch-equator`, `--bloch-vector`, `--bloch-axis`.
- Shadow: `--shadow-1`, `--shadow-2`.
- Background canvas: `--bg-point`, `--bg-point-fade`.

Every component that paints a color must consume a variable, not a literal.
Transitions: `* { transition: background-color 400ms ease, color 400ms ease, border-color 400ms ease, box-shadow 400ms ease; }` on the body — covers everything that morphs on theme swap. Canvas and WebGL components read variables via `getComputedStyle(document.documentElement).getPropertyValue('--bg-point')` and re-read on theme-change event.

## Review gates

- After scaffold: run `/codex:adversarial-review` on the new web/ skeleton.
- After TS engine port: run `/codex:review` on `web/lib/*.ts` and the Vitest tests.
- After UI components: run `/codex:review` again.
- Before final push: `/codex:adversarial-review` on the full diff.

## Stop conditions

- `pytest -q` must still pass 211 tests after the pivot (Python engine untouched).
- `npm test` (Vitest) must pass once tests exist.
- `npm run build` must succeed.
- All five routes return 200 in `next dev`.
