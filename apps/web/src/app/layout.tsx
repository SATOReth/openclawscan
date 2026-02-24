import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  metadataBase: new URL('https://openclawscan.xyz'),
  title: 'OpenClawScan — Tamper-proof receipts for AI agents',
  description: 'Cryptographically signed and verifiable action logs for AI agents. Ed25519 signatures, SHA-256 hashing, one-link sharing.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'OpenClawScan — Tamper-proof receipts for AI agents',
    description: 'Every action your AI agent takes — cryptographically signed and verifiable. Ed25519 + SHA-256. Share one link, prove everything.',
    url: 'https://openclawscan.xyz',
    siteName: 'OpenClawScan',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenClawScan — Tamper-proof receipts for AI agents',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenClawScan — Tamper-proof receipts for AI agents',
    description: 'Every action your AI agent takes — cryptographically signed and verifiable. Ed25519 + SHA-256. Free forever.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-tx font-mono">
        <Nav />
        <main className="max-w-[1100px] mx-auto px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
