import { ReactNode } from "react";
import { motion } from "framer-motion";

export function MobileShell({ children, noBottomPad }: { children: ReactNode; noBottomPad?: boolean }) {
  return (
    <div className="min-h-screen bg-brand-navy/5 flex">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`dg-mobile-shell dg-mobile-top-pad ${noBottomPad ? "" : "dg-mobile-bottom-pad"}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
