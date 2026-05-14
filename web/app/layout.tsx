import "./globals.css";

import { MotionConfig } from "framer-motion";
import { type Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";

import { AnimatedCursor } from "@/components/AnimatedCursor";
import { LiquidBackground } from "@/components/LiquidBackground";
import { Navigation } from "@/components/Navigation";
import { OpeningAnimation } from "@/components/OpeningAnimation";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["500", "600"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Quantum Noise Learning Lab",
  description:
    "Interactive single-qubit decoherence simulator: density matrices, Kraus channels, fidelity, purity, eigenvalue analysis, analytical validation, and a classical-style repetition-code intuition.",
  icons: { icon: "/favicon.svg" },
};

const themeBootstrap = `
(function(){try{
  var t=localStorage.getItem("qnl-theme");
  if(t!=="light"&&t!=="dark"){t="dark";}
  document.documentElement.setAttribute("data-theme",t);
}catch(_){document.documentElement.setAttribute("data-theme","dark");}})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} ${jetbrains.variable}`}
    >
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <MotionConfig reducedMotion="never">
          <ThemeProvider>
            <LiquidBackground />
            <AnimatedCursor />
            <OpeningAnimation />
            <Navigation />
            <PageTransition>{children}</PageTransition>
          </ThemeProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
