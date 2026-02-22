'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TBox, Skeleton, Empty } from '@/components/ui';

interface Task {
  task_id: string;
  slug: string;
  name: string;
  status: string;
  total_receipts: number;
  total_duration_ms: number;
  total_cost_usd: number;
  created_at: string;
  completed_at: string | null;
  agent: { id: string; name: string };
}

function formatDuration(ms: number) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m`;
}

function formatCost(usd: number) { return `$${usd.toFixed(3)}`; }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/tasks')
      .then(r => r.json())
      .then(d => { setTasks(d.tasks || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8"><Skeleton lines={6} /></div>;

  return (
    <div className="py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-bright">Tasks</h1>
        <p className="text-[11px] text-dim mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
      </div>

      {tasks.length === 0 ? (
        <TBox title="TASKS" color="#666">
          <Empty icon="◈" title="No tasks yet" description="Tasks are created automatically when you call scanner.startTask() in the SDK." />
        </TBox>
      ) : (
        <TBox title="TASK LOG" color="#60a5fa" noPad>
          <div className="text-[10.5px]">
            {/* Header */}
            <div className="grid gap-2 px-3.5 py-2 border-b border-faint text-[9px] text-ghost tracking-wide"
              style={{ gridTemplateColumns: '60px 1fr 80px 32px 44px 48px 28px 28px' }}>
              <span>STATUS</span><span>NAME</span><span>AGENT</span>
              <span className="text-right">#</span>
              <span className="text-right">DUR</span>
              <span className="text-right">COST</span>
              <span></span>
              <span></span>
            </div>
            {/* Rows */}
            {tasks.map(t => (
              <div
                key={t.task_id}
                className="grid gap-2 px-3.5 py-2.5 items-center border-b border-faint/50 last:border-b-0 hover:bg-hl transition-colors"
                style={{ gridTemplateColumns: '60px 1fr 80px 32px 44px 48px 28px 28px' }}
              >
                <span className={`text-[9px] px-1.5 py-0.5 border text-center ${
                  t.status === 'completed' ? 'text-accent border-accent/30 bg-accent/5' :
                  t.status === 'active' ? 'text-amber border-amber/30 bg-amber/5' :
                  'text-c-red border-c-red/30 bg-c-red/5'
                }`}>
                  {t.status === 'completed' ? '✓ done' : t.status}
                </span>
                <Link href={`/task/${t.slug}`} className="text-tx font-medium truncate hover:text-bright transition-colors">{t.name}</Link>
                <span className="text-dim truncate">{t.agent.name}</span>
                <span className="text-ghost text-right">{t.total_receipts}</span>
                <span className="text-ghost text-right">{formatDuration(t.total_duration_ms)}</span>
                <span className="text-dim text-right">{formatCost(t.total_cost_usd)}</span>
                <Link href={`/task/${t.slug}`} className="text-ghost text-right hover:text-tx transition-colors">→</Link>
                <button
                  onClick={() => window.open(`/api/tasks/${t.task_id}/pdf`, '_blank')}
                  className="text-ghost text-right hover:text-tx transition-colors text-[9px]"
                  title="Download PDF"
                >↓</button>
              </div>
            ))}
          </div>
        </TBox>
      )}

      <div className="mt-4 p-3 border border-faint bg-card text-[10px] text-dim">
        <span className="text-ghost">Tip:</span> Share task links publicly — anyone can verify the receipts at{' '}
        <span className="text-tx">openclawscan.xyz/task/[slug]</span>
      </div>
    </div>
  );
}
