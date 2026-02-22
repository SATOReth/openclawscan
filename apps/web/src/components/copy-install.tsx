'use client';

import { useState } from 'react';

export function CopyInstall({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = command;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="flex items-center gap-2 p-2.5 px-3.5 bg-card border border-faint mb-2.5 text-[12px] cursor-pointer hover:border-ghost transition-colors"
      onClick={handleCopy}
    >
      <span className="text-accent">$</span>
      <span className="text-tx">{command}</span>
      <span className="ml-auto text-[9px] text-ghost">
        {copied ? '✓ COPIED' : 'COPY'}
      </span>
    </div>
  );
}
