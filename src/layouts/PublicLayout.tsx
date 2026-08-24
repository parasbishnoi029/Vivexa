import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

export default function PublicLayout() {
  const location = useLocation();
  return (
    <div className="w-full h-full min-h-screen bg-[#030712] flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="flex-1 w-full flex flex-col"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
