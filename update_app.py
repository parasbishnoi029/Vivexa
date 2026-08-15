import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import for PublicLayout
if 'import PublicLayout' not in content:
    content = content.replace('import AdminLayout from "./layouts/AdminLayout";', 'import AdminLayout from "./layouts/AdminLayout";\nimport PublicLayout from "./layouts/PublicLayout";')

# Group public routes
public_paths = [
    '/', '/founders', '/about', '/platform', '/solutions',
    '/enterprise', '/resources', '/docs', '/pricing',
    '/product-tour', '/book-demo', '/terms', '/privacy'
]

# We will regex replace the array inside createBrowserRouter.
# Actually, an easier way is to just find each `{ path: "...", element: ... }` and if it's public, do nothing because we can do it manually, or...
