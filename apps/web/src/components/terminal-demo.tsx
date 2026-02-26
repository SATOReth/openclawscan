'use client';

import { useState, useEffect } from 'react';
import { TBox } from '@/components/ui';

interface Line {
  text: string;
  color?: string;
  prompt?: string;
  fast?: boolean;
  pause?: number;
}

const LINES: Line[] = [
  { prompt: '$', text: 'npx openclawscan init', color: '#f0f0f0', pause: 500 },
  { text: '', fast: true, pause: 50 },
  { text: '  ◈ OpenClawScan v1.2.0', color: '#22c55e', pause: 250 },
  { text: '  Generating Ed25519 keypair......', color: '#666', pause: 350 },
  { text: '  ✓ Keypair created', color: '#22c55e', pause: 150 },
  { text: '  ✓ Agent registered: sentinel-007', color: '#22c55e', pause: 150 },
  { text: '  ✓ Config saved → .openclawscan/', color: '#22c55e', pause: 400 },
  { text: '', fast: true, pause: 50 },
  { prompt: '$', text: "openclawscan start --task 'Audit TokenVault.sol'", color: '#f0f0f0', pause: 350 },
  { text: '', fast: true, pause: 50 },
  { text: '  ┌─ Task started ─────────────────────────┐', color: '#333', pause: 80 },
  { text: '  │ #0  web_search   source_fetch      1.8s │ ✓', color: '#666', pause: 100 },
  { text: '  │ #1  file_read    TokenVault.sol     0.2s │ ✓', color: '#666', pause: 100 },
  { text: '  │ #2  tool_call    slither_analysis   8.4s │ ✓', color: '#666', pause: 100 },
  { text: '  │ #3  tool_call    mythril_scan      12.0s │ ✓', color: '#666', pause: 100 },
  { text: '  │ #4  model_call   vuln_reasoning     6.2s │ ✓', color: '#666', pause: 100 },
  { text: '  │ #5  model_call   report_gen         5.8s │ ✓', color: '#666', pause: 100 },
  { text: '  │ #6  file_write   audit_report.md    0.4s │ ✓', color: '#666', pause: 100 },
  { text: '  └──────────────────────────────────────────┘', color: '#333', pause: 300 },
  { text: '', fast: true, pause: 50 },
  { text: '  ✓ 7 receipts · Ed25519 signed · seq #0→#6', color: '#22c55e', pause: 200 },
  { text: '  ✓ AES-256-GCM encrypted · viewing key set', color: '#60a5fa', pause: 200 },
  { text: '  ✓ Merkle root → Base L2 · tx 0x9112dc...', color: '#a78bfa', pause: 200 },
  { text: '', fast: true, pause: 50 },
  { text: '  Proof of Task complete ◈', color: '#22c55e', pause: 200 },
  { text: '  → openclawscan.xyz/task/a3f8c2b1', color: '#60a5fa', pause: 0 },
];

export function TerminalDemo() {
  const [out, setOut] = useState<Line[]>([]);
  const [li, setLi] = useState(0);
  const [ci, setCi] = useState(0);
  const [go, setGo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGo(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!go || li >= LINES.length) return;
    const line = LINES[li];
    if (ci <= line.text.length) {
      const t = setTimeout(() => {
        setOut(p => {
          const cp = [...p];
          cp[li] = { ...line, text: line.text.slice(0, ci) };
          return cp;
        });
        setCi(c => c + 1);
      }, line.fast ? 8 : 20);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLi(l => l + 1);
      setCi(0);
    }, line.pause || 120);
    return () => clearTimeout(t);
  }, [go, li, ci]);

  return (
    <TBox title="TERMINAL" color="#22c55e">
      <div className="text-[11px] leading-[1.75]">
        {out.map((l, i) => (
          <div key={i} className="whitespace-pre flex" style={{ color: l.color || '#666' }}>
            {l.prompt && <span className="text-accent mr-1.5">{l.prompt}</span>}
            <span>{l.text}</span>
            {i === li && li < LINES.length && <span className="cursor" />}
          </div>
        ))}
        {li >= LINES.length && (
          <div className="flex">
            <span className="text-accent mr-1.5">$</span>
            <span className="cursor" />
          </div>
        )}
      </div>
    </TBox>
  );
}
