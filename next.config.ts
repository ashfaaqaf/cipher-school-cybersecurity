import type { NextConfig } from 'next';

// GitHub Pages serves this repo under /cipher-school-cybersecurity.
const repo = process.env.PAGES_BASE_PATH;
const basePath = repo ? `/${repo}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
