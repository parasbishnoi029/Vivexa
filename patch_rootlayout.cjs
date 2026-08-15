const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace RootLayout completely to just render <Outlet /> without any animation wrappers that would unmount layouts
const newRootLayout = `
function RootLayout() {
  return <Outlet />;
}
`;

code = code.replace(/function RootLayout\(\) \{[\s\S]*?\n\}/, newRootLayout);

fs.writeFileSync('src/App.tsx', code);
