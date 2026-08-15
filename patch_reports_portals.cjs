const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/ExecutiveReports.tsx', 'utf8');

if (!code.includes('import { createPortal }')) {
  code = code.replace(
    'import { useState, useMemo } from "react";',
    'import { useState, useMemo } from "react";\nimport { createPortal } from "react-dom";'
  );
  // Just in case it's grouped differently
  if (!code.includes('import { createPortal }')) {
     code = 'import { createPortal } from "react-dom";\n' + code;
  }
}

// 1. New Report Modal: line 930 (approx)
// It is inside `<AnimatePresence>`:
//           {isGenerating && (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95 }} ...
//               className="fixed inset-0 ... "

// Actually, the easiest way to find and wrap these is:
// Find `<AnimatePresence>` blocks that wrap a `<motion.div>` with `fixed inset-0`.
// Or just wrap the whole conditional block in createPortal.

// Let's just use regex to bump the z-index of all fixed inset-0 to z-[9999], 
// AND change WorkspaceLayout.tsx's header to z-10 instead of z-20.
// Wait! If WorkspaceLayout's header is z-10, and main is z-10, they share the same stacking context level.
// Will they overlap correctly?
// If `<header>` and `<main>` are siblings without z-index, they stack in DOM order. 
// `<header>` is BEFORE `<main>`. So `<main>` would stack ON TOP of `<header>`.
// So if a modal is inside `<main>`, it would naturally cover `<header>`!
// Let's check WorkspaceLayout.tsx again.
