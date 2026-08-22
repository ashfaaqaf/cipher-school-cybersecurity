import type { Metadata, Viewport } from 'next';
import './globals.css';
import './study.css';
import './roles.css';
import './desktop.css';

const title = 'Cipher School — Master Cybersecurity';
const description = 'Learn cybersecurity from absolute beginner to expert. 96 written lessons in plain language, a 369-word jargon decoder, seven career paths, legal labs and on-device progress.';
const siteUrl = 'https://ashfaaqaf.github.io/cipher-school-cybersecurity';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'Cipher School',
  manifest: './manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cipher School',
  },
  formatDetection: { telephone: false },
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title,
    description,
    images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630, alt: 'Cipher School — Learn the system. Defend the future.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${siteUrl}/og.png`],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#070b12',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
