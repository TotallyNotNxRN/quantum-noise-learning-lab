export interface ModuleEntry {
  slug: string;
  number: number;
  title: string;
  summary: string;
  href: string;
}

export const MODULES: ModuleEntry[] = [
  {
    slug: "foundations",
    number: 1,
    title: "Foundations",
    summary:
      "Build single-qubit state vectors and density matrices. See why ρ — not |ψ⟩ — is the right object for noisy states.",
    href: "/foundations",
  },
  {
    slug: "noise",
    number: 2,
    title: "Noise",
    summary:
      "Watch amplitude damping, phase damping, and depolarizing channels deform ρ. Live Kraus operators and Δρ scalar summary.",
    href: "/noise",
  },
  {
    slug: "metrics",
    number: 3,
    title: "Metrics",
    summary:
      "Quantify the deformation with fidelity, purity, and eigenvalue analysis; sweep noise to see the trajectory.",
    href: "/metrics",
  },
  {
    slug: "validation",
    number: 4,
    title: "Validation",
    summary:
      "Side-by-side: simulated ρ against closed-form analytical formulas for |+⟩, with live |error| heatmap.",
    href: "/validation",
  },
  {
    slug: "protection",
    number: 5,
    title: "Protection",
    summary:
      "Classical-style 3-repetition success curves and an honest panel on what real quantum error correction adds.",
    href: "/protection",
  },
];
