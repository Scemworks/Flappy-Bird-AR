import './globals.css';

export const metadata = {
  title: 'Flappy Bird AR',
  description: 'Control the flight with your nose.',
  manifest: '/manifest.webmanifest',
  themeColor: '#071d3c',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Flappy Bird AR' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
