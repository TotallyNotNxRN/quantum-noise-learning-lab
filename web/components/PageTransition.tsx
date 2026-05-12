"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

/** Wraps every route's children in an AnimatePresence so navigation between
 *  pages crossfades + slides slightly. The pathname is the AnimatePresence
 *  key, ensuring the exit animation plays on route change. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={true}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
        transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-10"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
