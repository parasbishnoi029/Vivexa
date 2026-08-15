import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://vivexa.ai';

const routes = [
  '/',
  '/founders',
  '/about',
  '/platform',
  '/solutions',
  '/enterprise',
  '/resources',
  '/pricing',
  '/product-tour',
  '/book-demo',
  '/terms',
  '/privacy',
  '/login',
  '/register',
  '/forgot-password'
];

function generateSitemap() {
  const urls = routes.map((route) => {
    return `
  <url>
    <loc>${DOMAIN}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log('sitemap.xml generated successfully!');
}

generateSitemap();
