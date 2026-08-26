import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './study.css';
import './roles.css';
import './today.css';
import './find.css';
import './desktop.css';
import './print.css';
import './shell.css';
import './presence.css';
import './academy.css';
import './settings.css';

/*
 * Declared through next/font rather than a hand-written @font-face so the build
 * emits a <link rel="preload"> for each file. Without it the browser cannot
 * discover a font until it has downloaded and parsed the stylesheet that
 * mentions it, which is a whole round trip of reading the page in Segoe UI
 * before it flips. adjustFontFallback derives a size-adjusted local fallback
 * from the metrics, so that flip no longer moves the text either.
 */
const sans = localFont({
  src: './fonts/inter.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-sans',
  adjustFontFallback: 'Arial',
});

const mono = localFont({
  src: './fonts/jetbrains-mono.woff2',
  weight: '100 800',
  display: 'swap',
  variable: '--font-mono',
  adjustFontFallback: false,
});

const title = 'Cipher School — Train for Real Cybersecurity Work';
const description = 'Go from cybersecurity beginner to capable practitioner with 110 plain-language lessons, real artefact labs, active recall, career paths and proof you can show.';
const siteUrl = process.env.SITE_URL ?? 'https://ashfaaqaf.github.io/cipher-school-cybersecurity';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'Cipher School',
  manifest: './manifest.webmanifest',
  icons: {
    icon: [
      { url: './favicon.ico', sizes: 'any' },
      { url: './cipher-school-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: './cipher-school-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: './cipher-school-apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cipher School',
  },
  formatDetection: { telephone: false },
  keywords: [
    'cybersecurity course', 'learn cybersecurity', 'security fundamentals', 'OWASP Top 10',
    'MITRE ATT&CK', 'penetration testing', 'SOC analyst', 'VAPT', 'Burp Suite', 'Nmap',
    'security internship', 'Sri Lanka cybersecurity jobs', 'spaced repetition',
  ],
  authors: [{ name: 'Ashfaaq Ahamed' }],
  creator: 'Ashfaaq Ahamed',
  category: 'education',
  robots: { index: true, follow: true },
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
  themeColor: '#000000',
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
