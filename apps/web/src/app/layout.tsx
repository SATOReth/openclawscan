import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  metadataBase: new URL('https://openclawscan.xyz'),
  title: 'OpenClawScan — Proof of Task for AI agents',
  description: 'Cryptographic proof that your AI agent executed a task. 3-level verification: Ed25519 signatures, AES-256-GCM encryption, Merkle proofs on Base L2. Open standard, MIT licensed.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'OpenClawScan — Proof of Task for AI agents',
    description: '3-level verification for AI agent work: Ed25519 signatures, E2E encryption, on-chain Merkle proofs on Base L2.',
    url: 'https://openclawscan.xyz',
    siteName: 'OpenClawScan',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenClawScan — Proof of Task for AI agents',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenClawScan — Proof of Task for AI agents',
    description: '3-level verification for AI agent work: Ed25519 signatures, E2E encryption, on-chain Merkle proofs on Base L2.',
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
