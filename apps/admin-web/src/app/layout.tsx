import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Hind_Madurai } from 'next/font/google';

import { AuthProvider } from '@/lib/auth';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const hindMadurai = Hind_Madurai({
  subsets: ['tamil', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-hind-madurai',
});

export const metadata: Metadata = {
  title: 'DFC Command Center',
  description: 'Dinasari Food Courier — order lifecycle board for Madurai operations.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${hindMadurai.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
