'use client';

import { useEffect, useState } from 'react';
import { TBox, Stat, Skeleton, Empty } from '@/components/ui';

interface Agent {
  id: string;
  agent_id: string;
  display_name: string;
  public_key: string;
  description: string | null;
  is_public: boolean;
  total_receipts: number;
  total_tasks_completed: number;
  reputation_score: number;
  created_at: string;
  last_receipt_at: string | null;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ agent_id: '', display_name: '', public_key: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/agents')
      .then(r => r.json())
      .then(d => { setAgents(d.agents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/dashboard/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Failed to create agent');
      setSaving(false);
      return;
    }

    const { agent } = await res.json();
    setAgents(prev => [agent, ...prev]);
    setShowForm(false);
    setForm({ agent_id: '', display_name: '', public_key: '', description: '' });
    setSaving(false);
  }

  if (loading) return <div className="py-8"><Skeleton lines={6} /></div>;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-bright">Agents</h1>
          <p className="text-[11px] text-dim mt-0.5">{agents.length} registered agent{agents.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 text-[10px] font-bold bg-accent text-black"
        >
          {showForm ? 'CANCEL' : '+ NEW AGENT'}
        </button>
      </div>

      {/* ── New agent form ── */}
      {showForm && (
        <TBox title="REGISTER AGENT" color="#22c55e">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-ghost tracking-widest block mb-1">AGENT ID</label>
                <input type="text" value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
                  className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none"
                  placeholder="my-audit-agent" required />
              </div>
              <div>
                <label className="text-[9px] text-ghost tracking-widest block mb-1">DISPLAY NAME</label>
                <input type="text" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none"
                  placeholder="Audit Agent" required />
              </div>
            </div>
            <div>
              <label className="text-[9px] text-ghost tracking-widest block mb-1">PUBLIC KEY (ED25519 BASE64)</label>
              <input type="text" value={form.public_key} onChange={e => setForm(f => ({ ...f, public_key: e.target.value }))}
                className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none font-mono"
                placeholder="VzqZUrs/ZPyw+lN7kR5M4rKQD+NeAczT8dEyws6QnxI=" required />
            </div>
            <div>
              <label className="text-[9px] text-ghost tracking-widest block mb-1">DESCRIPTION (OPTIONAL)</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none"
                placeholder="Smart contract auditing agent" />
            </div>
            {error && <p className="text-[10px] text-c-red">{error}</p>}
            <button type="submit" disabled={saving} className="px-4 py-2 bg-accent text-black text-[11px] font-bold disabled:opacity-50">
              {saving ? 'Registering...' : 'REGISTER'}
            </button>
            <p className="text-[9px] text-ghost">
              Tip: Run <code className="text-dim">npx openclawscan init</code> to generate a keypair automatically.
            </p>
          </form>
        </TBox>
      )}

      {/* ── Agent list ── */}
      {agents.length === 0 ? (
        <TBox title="AGENTS" color="#666">
          <Empty icon="◈" title="No agents registered" description="Register your first agent to start generating receipts." />
        </TBox>
      ) : (
        agents.map(agent => (
          <TBox key={agent.id} title={agent.agent_id.toUpperCase()} color={agent.is_public ? '#22c55e' : '#666'}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[13px] font-bold text-bright">{agent.display_name}</p>
                {agent.description && <p className="text-[10px] text-dim mt-0.5">{agent.description}</p>}
              </div>
              <span className={`text-[9px] px-2 py-0.5 border ${
                agent.is_public ? 'text-accent border-accent/30 bg-accent/5' : 'text-ghost border-faint'
              }`}>
                {agent.is_public ? 'PUBLIC' : 'PRIVATE'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint -mx-4 -mb-3.5">
              <Stat label="RECEIPTS" value={String(agent.total_receipts)} />
              <Stat label="TASKS" value={String(agent.total_tasks_completed)} />
              <Stat label="REPUTATION" value={agent.reputation_score.toFixed(1)} color={agent.reputation_score > 0 ? '#22c55e' : undefined} />
              <Stat label="LAST ACTIVE" value={agent.last_receipt_at ? new Date(agent.last_receipt_at).toLocaleDateString() : 'Never'} />
            </div>
          </TBox>
        ))
      )}
    </div>
  );
}
