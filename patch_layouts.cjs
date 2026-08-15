const fs = require('fs');

const layouts = [
  'src/layouts/WorkspaceLayout.tsx',
  'src/layouts/PublicLayout.tsx',
  'src/layouts/AdminLayout.tsx'
];

for (const file of layouts) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace the specific <AnimatePresence mode="wait"> block for the <Outlet />
    // Using a regex that captures the AnimatePresence around the Outlet
    const regex = /<AnimatePresence mode="wait">\s*<motion\.div\s*key=\{location\.pathname\}[\s\S]*?<Outlet \/>\s*<\/motion\.div>\s*<\/AnimatePresence>/g;
    
    const replacement = `<AnimatePresence mode="wait">
               <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0, y: 8 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -8 }}
                 transition={{ duration: 0.15, ease: "easeOut" }}
                 className="h-full"
               >
                 <Outlet />
               </motion.div>
             </AnimatePresence>`;
             
    if (code.match(regex)) {
        code = code.replace(regex, replacement);
        fs.writeFileSync(file, code);
        console.log(`Updated ${file}`);
    } else {
        console.log(`Regex did not match in ${file}`);
        // Fallback for WorkspaceLayout if it differed slightly
        const fallbackRegex = /<AnimatePresence mode="wait">[\s\S]*?<Outlet \/>[\s\S]*?<\/AnimatePresence>/;
        if (code.match(fallbackRegex)) {
            code = code.replace(fallbackRegex, replacement);
            fs.writeFileSync(file, code);
            console.log(`Updated ${file} with fallback regex`);
        }
    }
  }
}
