import type { Metadata, Viewport } from 'next';
import './globals.css';
import './study.css';
import './roles.css';
import './today.css';
import './find.css';
import './desktop.css';
import './print.css';
import './shell.css';

const title = 'Cipher School — Master Cybersecurity';
const description = 'Learn cybersecurity from absolute beginner to expert. 110 written lessons in plain language, a 414-word jargon decoder, eight career paths, legal labs and on-device progress.';
const siteUrl = 'https://ashfaaqaf.github.io/cipher-school-cybersecurity';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'Cipher School',
  manifest: './manifest.webmanifest',
  icons: {
    icon: [
      { url: './icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: './icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: './apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
  return <html lang="en"><body>{children}</body></html>;
}
