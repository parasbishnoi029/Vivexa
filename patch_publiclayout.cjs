const fs = require('fs');
let code = `import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

export default function PublicLayout() {
  const location = useLocation();
  return (
    <div className="w-full h-full min-h-screen bg-[#030712] flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex-1 w-full flex flex-col"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
`;
fs.writeFileSync('src/layouts/PublicLayout.tsx', code);
