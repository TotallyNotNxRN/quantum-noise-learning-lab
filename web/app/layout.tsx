import "./globals.css";

import { MotionConfig } from "framer-motion";
import { type Metadata } from "next";

import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Navigation } from "@/components/Navigation";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Quantum Noise Learning Lab",
  description:
    "Interactive single-qubit decoherence simulator: density matrices, Kraus channels, fidelity, purity, eigenvalue analysis, analytical validation, and a classical-style repetition-code intuition.",
  icons: {
    icon: "/favicon.svg",
  },
};

// Runs synchronously before React hydrates so the right theme attribute is
// on <html> before first paint. Avoids a "white flash" if the user prefers
// light mode, and keeps SSR colors valid because CSS variables are
// resolved against an attribute that exists from the server response.
const themeBootstrap = `
(function(){try{
  var t=localStorage.getItem("qnl-theme");
  if(t!=="light"&&t!=="dark"){t="dark";}
  document.documentElement.setAttribute("data-theme",t);
}catch(_){document.documentElement.setAttribute("data-theme","dark");}})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme="dark" is the server-side default; the inline bootstrap
    // script swaps it to "light" instantly if the user previously chose so,
    // before React hydrates the ThemeProvider.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,wght@0,500;0,600;1,500&display=swap"
        />
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {/* Force motion on for all users; the UI explicitly requires the
            page transitions and 3D-tilt + animated background to be visible.
            CSS `prefers-reduced-motion` rule still trims unbounded loops. */}
        <MotionConfig reducedMotion="never">
          <ThemeProvider>
            <AnimatedBackground />
            <Navigation />
            <PageTransition>{children}</PageTransition>
          </ThemeProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
