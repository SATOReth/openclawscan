'use client';

import { useEffect, useState } from 'react';
import { TBox, Stat, Skeleton, Empty } from '@/components/ui';
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

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

interface CreatedAgent extends Agent {
  secret_key: string;
}

function CopyBtn({ text, label = 'COPY' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="px-2 py-0.5 text-[9px] font-bold border border-faint hover:border-ghost transition-colors"
    >
      {copied ? '✓ COPIED' : label}
    </button>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);
  const [secretAcknowledged, setSecretAcknowledged] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/agents')
      .then(r => r.json())
      .then(d => { setAgents(d.agents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleAgentIdChange(val: string) {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setAgentId(sanitized);
    if (!displayName || displayName === agentId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) {
      setDisplayName(sanitized.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId.trim() || !displayName.trim()) return;
    setSaving(true);
    setFormError('');

    const keyPair = nacl.sign.keyPair();
    const publicKeyB64 = encodeBase64(keyPair.publicKey);
    const secretKeyB64 = encodeBase64(keyPair.secretKey);

    const res = await fetch('/api/dashboard/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId.trim(),
        display_name: displayName.trim(),
        public_key: publicKeyB64,
        description: description.trim() || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || 'Failed to create agent');
      setSaving(false);
      return;
    }

    const { agent } = await res.json();
    setCreatedAgent({ ...agent, secret_key: secretKeyB64 });
    setSecretAcknowledged(false);
    setAgents(prev => [agent, ...prev]);
    setShowForm(false);
    setAgentId('');
    setDisplayName('');
    setDescription('');
    setSaving(false);
  }

  if (loading) return <div className="py-8"><Skeleton lines={6} /></div>;

  return (
    <div className="py-6">
      {/* ── Secret key modal (shown once after creation) ── */}
      {createdAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-[520px] w-full bg-bg border border-accent/30">
            <div className="px-5 py-4 border-b border-faint">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-accent">◈</span>
                <h2 className="text-[15px] font-bold text-bright">Agent registered</h2>
              </div>
              <p className="text-[11px] text-dim">{createdAgent.display_name} ({createdAgent.agent_id})</p>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-start gap-2 mb-4 p-3 border border-yellow-500/30 bg-yellow-500/5">
                <span className="text-yellow-500 text-[13px] mt-0.5">⚠</span>
                <div>
                  <p className="text-[11px] text-yellow-400 font-bold mb-0.5">Save your secret key now</p>
                  <p className="text-[10px] text-dim leading-relaxed">
                    This is the only time you'll see this key. It signs your receipts.
                    If you lose it, register a new agent.
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-ghost tracking-widest">SECRET KEY (Ed25519)</span>
                  <CopyBtn text={createdAgent.secret_key} />
                </div>
                <div className="bg-card border border-faint p-3 font-mono text-[10px] text-tx break-all leading-relaxed select-all">
                  {createdAgent.secret_key}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-ghost tracking-widest">PUBLIC KEY (Ed25519)</span>
                  <CopyBtn text={createdAgent.public_key} />
                </div>
                <div className="bg-card border border-faint p-3 font-mono text-[10px] text-dim break-all leading-relaxed">
                  {createdAgent.public_key}
                </div>
              </div>

              <div className="mb-4">
                <span className="text-[9px] text-ghost tracking-widest block mb-1">SDK CONFIGURATION</span>
                <div className="bg-card border border-faint p-3 font-mono text-[10px] text-dim leading-relaxed overflow-auto">
                  <span className="text-ghost">const</span> scanner = <span className="text-ghost">new</span> <span className="text-accent">OpenClawScan</span>({'{'}<br/>
                  {'  '}agentId: <span className="text-yellow-300">&apos;{createdAgent.agent_id}&apos;</span>,<br/>
                  {'  '}secretKey: <span className="text-yellow-300">&apos;YOUR_SECRET_KEY&apos;</span>,<br/>
                  {'  '}apiKey: <span className="text-yellow-300">&apos;YOUR_API_KEY&apos;</span>,<br/>
                  {'}'});
                </div>
              </div>

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={secretAcknowledged}
                  onChange={e => setSecretAcknowledged(e.target.checked)}
                  className="accent-green-500"
                />
                <span className="text-[11px] text-dim">I&apos;ve saved my secret key</span>
              </label>

              <button
                onClick={() => { setCreatedAgent(null); setSecretAcknowledged(false); }}
                disabled={!secretAcknowledged}
                className="w-full py-2.5 bg-accent text-black text-[11px] font-bold disabled:opacity-30 transition-opacity"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-bright">Agents</h1>
          <p className="text-[11px] text-dim mt-0.5">{agents.length} registered agent{agents.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 text-[10px] font-bold bg-accent text-black"
        >
          {showForm ? 'CANCEL' : '+ REGISTER AGENT'}
        </button>
      </div>

      {/* ── Registration form ── */}
      {showForm && (
        <TBox title="REGISTER AGENT" color="#22c55e">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-ghost tracking-widest block mb-1">AGENT ID</label>
                <input
                  type="text" value={agentId} onChange={e => handleAgentIdChange(e.target.value)}
                  className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none"
                  placeholder="my-audit-agent" required maxLength={48}
                />
                <p className="text-[9px] text-ghost mt-1">Lowercase, alphanumeric + hyphens</p>
              </div>
              <div>
                <label className="text-[9px] text-ghost tracking-widest block mb-1">DISPLAY NAME</label>
                <input
                  type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none"
                  placeholder="Audit Agent" required maxLength={64}
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] text-ghost tracking-widest block mb-1">DESCRIPTION (OPTIONAL)</label>
              <input
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none"
                placeholder="Smart contract auditing agent" maxLength={200}
              />
            </div>
            {formError && <p className="text-[10px] text-red-400">{formError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-accent text-black text-[11px] font-bold disabled:opacity-50">
                {saving ? 'GENERATING KEYS...' : 'REGISTER'}
              </button>
              <p className="text-[10px] text-ghost">Ed25519 keypair generated in your browser</p>
            </div>
          </form>
        </TBox>
      )}

      {/* ── Agent list ── */}
      {agents.length === 0 && !showForm ? (
        <TBox title="AGENTS" color="#666">
          <Empty icon="◈" title="No agents registered" description="Register your first agent to start generating tamper-proof receipts." />
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
            <div className="mb-3">
              <span className="text-[8px] text-ghost tracking-widest">PUBLIC KEY</span>
              <p className="text-[10px] text-dim font-mono break-all mt-0.5">{agent.public_key}</p>
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
