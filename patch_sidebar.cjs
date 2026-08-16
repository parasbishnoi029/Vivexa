const fs = require('fs');
let code = fs.readFileSync('src/layouts/WorkspaceLayout.tsx', 'utf8');

// I need to inject DashboardBuilder route
code = code.replace(
  '<NavItem to="/workspace/notebooks" icon={TerminalSquare}>Notebooks</NavItem>',
  '<NavItem to="/workspace/notebooks" icon={TerminalSquare}>Notebooks</NavItem>\n                  <NavItem to="/workspace/dashboards" icon={LayoutDashboard}>Dashboards (BI)</NavItem>'
);
code = code.replace(
  '<NavItem to="/workspace/notebooks" icon={TerminalSquare} onClick={() => setIsMobileSidebarOpen(false)}>Notebooks</NavItem>',
  '<NavItem to="/workspace/notebooks" icon={TerminalSquare} onClick={() => setIsMobileSidebarOpen(false)}>Notebooks</NavItem>\n                      <NavItem to="/workspace/dashboards" icon={LayoutDashboard} onClick={() => setIsMobileSidebarOpen(false)}>Dashboards (BI)</NavItem>'
);
fs.writeFileSync('src/layouts/WorkspaceLayout.tsx', code);

// Now I need to inject it into the router (App.tsx)
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  'import Notebooks from "./pages/workspace/Notebooks";',
  'import Notebooks from "./pages/workspace/Notebooks";\nimport DashboardsBuilder from "./pages/workspace/DashboardsBuilder";'
);
appCode = appCode.replace(
  '<Route path="notebooks" element={<Notebooks />} />',
  '<Route path="notebooks" element={<Notebooks />} />\n          <Route path="dashboards" element={<DashboardsBuilder />} />'
);
fs.writeFileSync('src/App.tsx', appCode);

