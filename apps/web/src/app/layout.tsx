import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  title: 'OpenClawScan — Tamper-proof receipts for AI agents',
  description: 'Cryptographically signed and verifiable action logs for AI agents. Ed25519 signatures, SHA-256 hashing, one-link sharing.',
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
