import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cipher School — Master Cybersecurity',
    short_name: 'Cipher School',
    description: 'A mission-based cybersecurity field guide from beginner to researcher.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070b12',
    theme_color: '#070b12',
    orientation: 'portrait-primary',
  };
}
