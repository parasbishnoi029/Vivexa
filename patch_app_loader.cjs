const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const loaderEffect = `
  useEffect(() => {
    useAuthStore.getState().initialize();
    
    // Smoothly remove the initial static loader once React is hydrated
    const loader = document.getElementById('initial-loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        setTimeout(() => loader.remove(), 400);
      }, 100); // Tiny delay to ensure CSS applies
    }
  }, []);
`;

code = code.replace(/useEffect\(\(\) => \{\s*useAuthStore\.getState\(\)\.initialize\(\);\s*\}, \[\]\);/, loaderEffect);

fs.writeFileSync('src/App.tsx', code);
