import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flappy Bird AR',
  description: 'Control the flight with your nose.',
  manifest: '/manifest.webmanifest',
  themeColor: '#071d3c',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Flappy Bird AR' },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
