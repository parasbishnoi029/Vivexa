const fs = require('fs');

const path = 'src/pages/workspace/Dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// The line: <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
// Let's replace it:
code = code.replace(
  /<motion.div variants=\{item\} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">/g,
  '<motion.div variants={item} layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">'
);

// We replace: <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">
// With: <motion.div layout whileHover={{ y: -4, scale: 1.02 }} transition={{ layout: { type: "spring", stiffness: 350, damping: 25 }, type: "spring", stiffness: 400, damping: 25 }} className="h-full">
code = code.replace(
  /<motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">/g,
  '<motion.div layout whileHover={{ y: -4, scale: 1.02 }} transition={{ layout: { type: "spring", stiffness: 350, damping: 25 }, type: "spring", stiffness: 400, damping: 25 }} className="h-full">'
);

// To ensure inner elements smoothly transition if their bounding boxes change (e.g. text changing length)
code = code.replace(
  /className="text-3xl font-black text-white tracking-tight">\{stats/g,
  'className="text-3xl font-black text-white tracking-tight"><motion.span layout>{stats'
);
code = code.replace(
  /\}<\/div>\n              <div className="text-xs/g,
  '}</motion.span></div>\n              <div className="text-xs'
);


fs.writeFileSync(path, code);
