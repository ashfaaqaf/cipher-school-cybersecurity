/** Build host-specific crawler files from the same trusted origin as metadata. */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fallback = 'https://ashfaaqaf.github.io/cipher-school-cybersecurity';
const origin = new URL(process.env.SITE_URL ?? fallback);

if (!['http:', 'https:'].includes(origin.protocol)) {
  throw new Error('SITE_URL must begin with http:// or https://');
}

const siteUrl = origin.href.replace(/\/$/, '');
const pages = [
  { path: '/', priority: '1.0' },
  { path: '/#/review', priority: '0.6' },
  { path: '/#/paths', priority: '0.6' },
  { path: '/#/words', priority: '0.6' },
  { path: '/#/sources', priority: '0.6' },
];

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(({ path: pagePath, priority }) => `  <url>
    <loc>${siteUrl}${pagePath}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

await Promise.all([
  writeFile(path.join(ROOT, 'public', 'robots.txt'), robots),
  writeFile(path.join(ROOT, 'public', 'sitemap.xml'), sitemap),
]);

console.log(`site files: ${siteUrl}`);
