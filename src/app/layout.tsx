import type { Metadata } from 'next';
import { Luckiest_Guy, Fredoka } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
});

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-luckiest-guy',
});

export const metadata: Metadata = {
  title: 'Radiator Routes — Your Road Trip Adventure Planner',
  description: 'Voice-first intelligent travel planning inspired by the spirit of Route 66. Plan your perfect road trip with AI-powered recommendations.',
  keywords: 'travel, road trip, route 66, AI travel planner, voice planning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${fredoka.variable} ${luckiestGuy.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      </head>
      <body className={fredoka.className} style={{ fontFamily: 'Fredoka, Arial, sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}