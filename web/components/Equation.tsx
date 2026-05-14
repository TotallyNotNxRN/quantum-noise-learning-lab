"use client";

import katex from "katex";
import { useMemo } from "react";

interface EquationProps {
  latex: string;
  display?: boolean;
  className?: string;
  label?: string;
}

/** KaTeX-rendered equation. Display mode renders as a centered block with
 *  generous padding + a thin accent rule so beginners can spot equations
 *  at a glance. Inline mode stays small for use in body copy. */
export function Equation({ latex, display = true, className, label }: EquationProps) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        throwOnError: false,
        displayMode: display,
        output: "html",
        strict: "ignore",
        trust: false,
      }),
    [latex, display],
  );

  if (!display) {
    return (
      <span
        className={["qnl-eq-inline", className ?? ""].join(" ")}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={["qnl-eq-block", className ?? ""].join(" ")}
      style={{
        position: "relative",
        margin: "1rem 0",
        padding: "1.1rem 1.25rem 1rem",
        borderRadius: 12,
        background: "color-mix(in srgb, var(--bg-deep) 50%, transparent)",
        border: "1px solid var(--panel-border)",
        boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--text) 4%, transparent)",
        overflowX: "auto",
      }}
    >
      {label ? (
        <div
          className="mono"
          style={{
            position: "absolute",
            top: -10,
            left: 16,
            padding: "0 8px",
            background: "var(--bg)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
          }}
        >
          {label}
        </div>
      ) : null}
      <div
        style={{ fontSize: "1.1rem", lineHeight: 1.5, color: "var(--text)" }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

interface SymbolDef {
  symbol: string;
  meaning: string;
}

/** Mini-glossary for the unfamiliar bra/ket / channel symbols used above.
 *  Renders below the equation block so beginners can decode each glyph
 *  without leaving the page. */
export function SymbolLegend({ items }: { items: SymbolDef[] }) {
  return (
    <ul
      style={{
        margin: "0.5rem 0 1rem",
        padding: 0,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        columnGap: "0.85rem",
        rowGap: "0.35rem",
        listStyle: "none",
        fontSize: "0.82rem",
        color: "var(--text-dim)",
      }}
    >
      {items.map((it) => (
        <SymbolRow key={it.symbol} {...it} />
      ))}
    </ul>
  );
}

function SymbolRow({ symbol, meaning }: SymbolDef) {
  const html = useMemo(
    () =>
      katex.renderToString(symbol, {
        throwOnError: false,
        displayMode: false,
        output: "html",
        strict: "ignore",
      }),
    [symbol],
  );
  return (
    <>
      <li
        style={{ color: "var(--text)", fontSize: "0.95rem" }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <li>{meaning}</li>
    </>
  );
}
