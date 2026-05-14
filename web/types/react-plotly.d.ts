declare module "react-plotly.js/factory" {
  import type { ComponentType } from "react";
  // Plotly's factory returns a React component that accepts arbitrary
  // data/layout/config props. We type loosely to avoid pulling in the
  // full plotly.js type surface.
  const createPlotlyComponent: (plotly: unknown) => ComponentType<{
    data: unknown[];
    layout?: unknown;
    config?: unknown;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    onInitialized?: (...args: unknown[]) => void;
    onUpdate?: (...args: unknown[]) => void;
  }>;
  export default createPlotlyComponent;
}

declare module "plotly.js-basic-dist";
