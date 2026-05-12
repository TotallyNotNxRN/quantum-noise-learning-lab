"use client";

import katex from "katex";
import { useMemo } from "react";

interface EquationProps {
  latex: string;
  display?: boolean;
  className?: string;
}

/** Server- or client-rendered KaTeX. We render to a string at build/render
 *  time and dangerouslySetInnerHTML — the latex strings are hard-coded in
 *  the source, never user-supplied. */
export function Equation({ latex, display = true, className }: EquationProps) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        throwOnError: false,
        displayMode: display,
        output: "html",
      }),
    [latex, display],
  );
  return (
    <span
      className={["text-ink", className ?? ""].join(" ")}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
