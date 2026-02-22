'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TBox, Stat, Skeleton, Empty } from '@/components/ui';

interface DashStats {
  agents: number;
  receipts: number;
  tasks: number;
  total_cost_usd: number;
  total_tokens: number;
  recent: Array<{
    receipt_id: string;
    action_type: string;
    action_name: string;
    cost_usd: number;
    timestamp: string;
    action_duration_ms: number;
  }>;
}

function formatCost(usd: number) { return `$${usd.toFixed(2)}`; }
function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8"><Skeleton lines={6} /></div>;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-bright">Dashboard</h1>
          <p className="text-[11px] text-dim mt-0.5">Overview of your agents and activity</p>
        </div>
        <div className="flex gap-1.5">
          <Link href="/dashboard/agents" className="px-3 py-2 text-[10px] text-dim border border-faint hover:border-ghost transition-colors">
            AGENTS
          </Link>
          <Link href="/dashboard/tasks" className="px-3 py-2 text-[10px] text-dim border border-faint hover:border-ghost transition-colors">
            TASKS
          </Link>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-faint mb-6">
        <Stat label="AGENTS" value={String(stats?.agents || 0)} />
        <Stat label="RECEIPTS" value={String(stats?.receipts || 0)} />
        <Stat label="TASKS" value={String(stats?.tasks || 0)} />
        <Stat label="TOTAL COST" value={formatCost(stats?.total_cost_usd || 0)} />
        <Stat label="TOKENS" value={formatTokens(stats?.total_tokens || 0)} />
      </div>

      {/* ── Quick start ── */}
      {stats?.agents === 0 && (
        <TBox title="GET STARTED" color="#22c55e">
          <div className="space-y-3">
            <div className="flex gap-2.5 items-center">
              <span className="text-[10px] text-accent font-bold">01</span>
              <span className="text-[12px] font-bold text-bright">Install the SDK</span>
            </div>
            <code className="text-[11px] text-ghost bg-bg px-3 py-1.5 block border border-faint">
              npm install @openclawscan/sdk
            </code>
            <div className="flex gap-2.5 items-center">
              <span className="text-[10px] text-accent font-bold">02</span>
              <span className="text-[12px] font-bold text-bright">Register your agent</span>
            </div>
            <p className="text-[10.5px] text-dim">
              Generate a keypair and register your agent via the SDK or the{' '}
              <Link href="/dashboard/agents" className="text-accent hover:underline">agents page</Link>.
            </p>
            <div className="flex gap-2.5 items-center">
              <span className="text-[10px] text-accent font-bold">03</span>
              <span className="text-[12px] font-bold text-bright">Start capturing</span>
            </div>
            <p className="text-[10.5px] text-dim">
              Every <code className="text-ghost">scanner.capture()</code> call generates a signed receipt automatically.
            </p>
          </div>
        </TBox>
      )}

      {/* ── Recent Activity ── */}
      <TBox title="RECENT ACTIVITY" color="#60a5fa" noPad>
        {!stats?.recent?.length ? (
          <Empty icon="◈" title="No activity yet" description="Receipts will appear here as your agent generates them." />
        ) : (
          <div className="text-[10.5px]">
            <div className="grid gap-2 px-3.5 py-2 border-b border-faint text-[9px] text-ghost tracking-wide"
              style={{ gridTemplateColumns: '78px 1fr 48px 52px' }}>
              <span>TYPE</span><span>ACTION</span><span className="text-right">COST</span><span className="text-right">WHEN</span>
            </div>
            {stats.recent.map(r => (
              <Link
                key={r.receipt_id}
                href={`/receipt/${r.receipt_id}`}
                className="grid gap-2 px-3.5 py-2 border-b border-faint/50 last:border-b-0 hover:bg-hl transition-colors"
                style={{ gridTemplateColumns: '78px 1fr 48px 52px' }}
              >
                <span className="text-dim">{r.action_type}</span>
                <span className="text-tx font-medium truncate">{r.action_name}</span>
                <span className="text-dim text-right">{formatCost(r.cost_usd)}</span>
                <span className="text-ghost text-right">{timeAgo(r.timestamp)}</span>
              </Link>
            ))}
          </div>
        )}
      </TBox>

      {/* ── API Key reminder ── */}
      <TBox title="YOUR API KEY" color="#eab308">
        <p className="text-[10.5px] text-dim leading-relaxed">
          Your API key is shown once when you create your account. Use it in the SDK:
        </p>
        <code className="text-[10px] text-ghost bg-bg px-3 py-1.5 mt-2 block border border-faint overflow-auto">
          {'const scanner = new OpenClawScan({ agentId: "...", apiKey: "ocs_..." })'}
        </code>
        <p className="text-[10px] text-ghost mt-2">
          Your API key was generated when you signed up. Check the <strong className="text-dim">owners</strong> table in your Supabase dashboard.
        </p>
      </TBox>
    </div>
  );
}
