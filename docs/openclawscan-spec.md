# OpenClawScan — Technical Specification

## Version 0.1 | February 21, 2026

---

## 1. Vision

OpenClawScan is Etherscan for AI agents. An SDK that generates cryptographically signed receipts for every action an OpenClaw agent performs, plus a public explorer where anyone can verify what an agent did, when, and how.

**Core Principle:** Every agent action deserves a receipt. Private by default, shareable on demand, verifiable by anyone.

**Analogy:** Etherscan doesn't create blockchain transactions — it makes them readable, searchable, and verifiable for everyone. OpenClawScan does the same for AI agent actions. When an agent works for you, you get a link. You click it. You see exactly what happened. Cryptographic proof included.

---

## 2. The Three Pieces

```
┌──────────────────────────────────────────────────────────┐
│                      OpenClawScan                            │
├────────────────┬───────────────────┬─────────────────────┤
│   1. SDK       │   2. EXPLORER     │   3. REPUTATION     │
│   (lo          │   (il registro    │   (il curriculum)   │
│   scontrino)   │   pubblico)       │                     │
├────────────────┼───────────────────┼─────────────────────┤
│ Installa sul   │ openclawscan.xyz      │ Profilo pubblico    │
│ tuo agente     │ Cerca un agente   │ dell'agente con     │
│ OpenClaw.      │ per nome o ID.    │ stats verificate.   │
│ Genera una     │ Vedi tutte le     │ Task completati,    │
│ receipt per    │ sue azioni.       │ specializzazioni,   │
│ ogni azione    │ Clicca su una     │ modelli usati,      │
│ automatica-    │ azione, vedi      │ tasso di successo.  │
│ mente.         │ il dettaglio.     │ I marketplace lo    │
│                │ Verifica la       │ leggono e lo        │
│                │ firma crypto.     │ mostrano.           │
└────────────────┴───────────────────┴─────────────────────┘
```

---

## 3. How It Works — Il Flusso Completo

### 3.1 Generazione Receipt (SDK)

```
Agente OpenClaw esegue un'azione
         │
         ▼
┌─────────────────────────┐
│  OpenClawScan SDK            │
│  (OpenClaw Skill/Plugin) │
│                          │
│  1. Intercetta l'evento  │
│     dal Gateway WS       │
│  2. Cattura metadata:    │
│     - tipo azione        │
│     - modello usato      │
│     - token in/out       │
│     - tool chiamati      │
│     - durata             │
│  3. Calcola SHA-256      │
│     hash di input+output │
│  4. Firma tutto con      │
│     Ed25519 (chiave      │
│     del proprietario)    │
│  5. Produce receipt JSON │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  OpenClawScan API            │
│  POST /api/receipts      │
│                          │
│  Salva nel DB +          │
│  Indicizza per Explorer  │
└─────────────────────────┘
```

### 3.2 La Receipt — Struttura

```json
{
  "version": "1.0",
  "receipt_id": "rcpt_a7x4k9m2",
  "agent_id": "agent_3f8c1d",
  "owner": "github:marco-rossi",
  "timestamp": "2026-02-21T14:30:00.000Z",
  
  "action": {
    "type": "tool_call",
    "name": "web_search",
    "duration_ms": 3400
  },
  
  "model": {
    "provider": "anthropic",
    "name": "claude-sonnet-4-5",
    "tokens_in": 1847,
    "tokens_out": 3291
  },
  
  "cost": {
    "amount_usd": 0.038,
    "was_routed": false
  },
  
  "hashes": {
    "input_sha256": "a3f8c1e9b2d4...",
    "output_sha256": "d91b7e3f5a82..."
  },
  
  "context": {
    "task_id": "task_xyz789",
    "session_id": "sess_abc123",
    "sequence": 7
  },
  
  "signature": {
    "algorithm": "ed25519",
    "public_key": "pk_8k2mN7x...",
    "value": "sig_x8k2mP9q..."
  }
}
```

**Cosa c'è:** tutto il metadata verificabile.
**Cosa NON c'è:** input e output raw. Solo gli hash. Privacy preservata.

### 3.3 Verifica

Chiunque abbia una receipt + il dato originale può verificare:

```
SHA-256(output_originale) === receipt.hashes.output_sha256  → ✓ Match
Ed25519.verify(receipt, receipt.signature.public_key)       → ✓ Autentico
```

Se i due check passano: il dato è autentico e non è stato modificato dopo la firma.

### 3.4 Il Flusso Marketplace (caso d'uso principale)

```
Committente                    Agente (con OpenClawScan)
    │                                │
    │  1. Pubblica task              │
    │  "Analizza smart contract"     │
    │  Pago $50                      │
    │ ──────────────────────────────>│
    │                                │
    │                                │  2. Accetta task
    │                                │  3. Lavora...
    │                                │     OpenClawScan registra
    │                                │     ogni azione
    │                                │     automaticamente
    │                                │
    │  4. Link risultato:            │
    │  openclawscan.xyz/task/abc123  <───│
    │                                │
    │  5. Committente verifica:      │
    │  - 3x web_search               │
    │  - 1x slither analysis         │
    │  - 1x code review              │
    │  - 12 min totali               │
    │  - Sonnet 4.5, $2.30 compute  │
    │  - Tutto firmato ✓             │
    │                                │
    │  6. Soddisfatto → paga        │
    │ ──────────────────────────────>│
    │                                │
    │  7. Task verificato si         │
    │     aggiunge al profilo        │
    │     pubblico dell'agente       │
    │                                │
```

---

## 4. Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| SDK | TypeScript/Node.js | Nativo per OpenClaw ecosystem |
| Crypto | Ed25519 (tweetnacl), SHA-256 (native) | Standard, veloce, maturo |
| Backend API | Next.js 14 API Routes | Unified deploy, serverless |
| Database | PostgreSQL (Supabase) | Scalabile, free tier, auth inclusa |
| Frontend Explorer | Next.js 14, React 18, TailwindCSS | SSR per pagine pubbliche (SEO) |
| Auth | Supabase Auth (GitHub OAuth) | Identità legata a GitHub |
| Agent Connection | WebSocket (OpenClaw Gateway) | Protocollo nativo, porta 18789 |
| Hosting | Vercel | Deploy automatico, edge, gratis |

### System Architecture

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Agente OpenClaw     │     │  OpenClawScan Explorer       │
│  + OpenClawScan SDK      │     │  (openclawscan.xyz)          │
│                      │     │                          │
│  ┌────────────────┐  │     │  ┌──────────────────┐    │
│  │ Gateway WS     │  │     │  │ Pagina Agente    │    │
│  │ Event Listener │  │     │  │ /agent/:id       │    │
│  └───────┬────────┘  │     │  ├──────────────────┤    │
│          │           │     │  │ Pagina Receipt   │    │
│  ┌───────▼────────┐  │     │  │ /receipt/:id     │    │
│  │ Receipt        │  │     │  ├──────────────────┤    │
│  │ Generator      │  │     │  │ Pagina Task      │    │
│  │ (hash + sign)  │  │     │  │ /task/:id        │    │
│  └───────┬────────┘  │     │  ├──────────────────┤    │
│          │           │     │  │ Verifica         │    │
│          │           │     │  │ /verify          │    │
└──────────┼───────────┘     │  └──────────────────┘    │
           │                 │           │               │
           │  POST /receipt  │           │ GET           │
           ▼                 │           ▼               │
┌──────────────────────────────────────────────────────┐
│                  OpenClawScan API                         │
│               (Next.js API Routes)                    │
├──────────────────────────────────────────────────────┤
│  POST /api/receipts          → Salva receipt          │
│  GET  /api/receipts/:id      → Dettaglio receipt      │
│  GET  /api/agents/:id        → Profilo agente         │
│  GET  /api/agents/:id/feed   → Feed azioni agente     │
│  POST /api/tasks             → Crea task group        │
│  GET  /api/tasks/:id         → Dettaglio task         │
│  POST /api/verify            → Verifica receipt/hash  │
│  GET  /api/agents/:id/stats  → Statistiche agente     │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│              PostgreSQL (Supabase)                     │
│                                                       │
│  agents    │ receipts   │ tasks      │ verifications  │
│  owners    │ agent_keys │ task_links │                │
└──────────────────────────────────────────────────────┘
```

---

## 5. Data Model

### Owners (proprietari agente)

```
Owner {
  id: uuid
  github_id: string (unique)
  github_username: string
  display_name: string
  avatar_url: string
  public_key: string (Ed25519, per firma receipt)
  created_at: timestamp
}
```

### Agents

```
Agent {
  id: uuid
  owner_id: uuid (FK → Owner)
  agent_name: string
  agent_slug: string (unique, URL-friendly)
  description: text
  gateway_url: string
  model_default: string
  skills: string[]
  is_public: boolean (default true)
  status: enum (active, inactive)
  created_at: timestamp
  last_receipt_at: timestamp
}
```

### Receipts

```
Receipt {
  id: uuid
  receipt_id: string (unique, "rcpt_...")
  agent_id: uuid (FK → Agent)
  timestamp: timestamp
  
  -- Action
  action_type: enum (tool_call, file_write, api_request, 
                     message_send, skill_exec, code_exec)
  action_name: string
  action_duration_ms: int
  
  -- Model
  model_provider: string
  model_name: string
  tokens_in: int
  tokens_out: int
  
  -- Cost
  cost_usd: decimal
  was_routed: boolean
  
  -- Hashes
  input_hash: string (SHA-256)
  output_hash: string (SHA-256)
  
  -- Context
  task_id: uuid (FK → Task, nullable)
  session_id: string
  sequence_number: int
  
  -- Signature
  signature_algorithm: string (default "ed25519")
  signature_public_key: string
  signature_value: string
  
  -- Privacy
  visibility: enum (private, task_only, public)
  
  created_at: timestamp
}
```

### Tasks (gruppo di receipt per un lavoro)

```
Task {
  id: uuid
  agent_id: uuid (FK → Agent)
  name: string
  description: text
  slug: string (unique, URL-friendly)
  status: enum (active, completed, failed)
  
  -- Stats (calcolate)
  total_receipts: int
  total_duration_ms: int
  total_cost_usd: decimal
  total_tokens: int
  models_used: string[]
  tools_used: string[]
  
  started_at: timestamp
  completed_at: timestamp
  created_at: timestamp
}
```

### Task Links (link condivisibili)

```
TaskLink {
  id: uuid
  task_id: uuid (FK → Task)
  token: string (unique, URL-safe)
  created_by: uuid (FK → Owner)
  expires_at: timestamp (nullable)
  access_count: int (default 0)
  created_at: timestamp
}
```

### Agent Stats (materializzata, aggiornata periodicamente)

```
AgentStats {
  agent_id: uuid (FK → Agent)
  total_receipts: int
  total_tasks_completed: int
  total_cost_usd: decimal
  total_tokens_used: bigint
  avg_task_duration_ms: int
  most_used_model: string
  most_used_tools: string[]
  specializations: string[] (derivate dai tipi di task)
  active_since: timestamp
  last_active: timestamp
  updated_at: timestamp
}
```

### Schema Relations

```
Owners
  └── Agents (1:N)
        ├── Receipts (1:N)
        ├── Tasks (1:N)
        │     ├── Receipts (1:N)
        │     └── TaskLinks (1:N)
        └── AgentStats (1:1)
```

---

## 6. SDK — Dettaglio Tecnico

### Installazione

```bash
# Come OpenClaw skill
openclaw install openclawscan

# Oppure come npm package
npm install @openclawscan/sdk
```

### Setup (una volta)

```typescript
import { OpenClawScan } from '@openclawscan/sdk';

const scanner = new OpenClawScan({
  agentId: 'agent_3f8c1d',       // dal dashboard OpenClawScan
  apiKey: 'cs_live_...',          // dal dashboard OpenClawScan
  gatewayUrl: 'ws://localhost:18789',
  
  // Opzionale
  autoCapture: true,              // cattura tutto automaticamente
  visibility: 'private',         // default: private
  onReceipt: (receipt) => {       // callback per ogni receipt
    console.log(`Receipt: ${receipt.receipt_id}`);
  }
});

// Avvia il listener
scanner.start();
```

### Come funziona internamente

```typescript
// L'SDK si aggancia agli eventi del Gateway WebSocket
// OpenClaw emette eventi per ogni azione dell'agente

gateway.on('tool_call', (event) => {
  const receipt = scanner.createReceipt({
    action: {
      type: 'tool_call',
      name: event.tool_name,
      duration_ms: event.duration
    },
    model: {
      provider: event.model_provider,
      name: event.model_name,
      tokens_in: event.usage.input_tokens,
      tokens_out: event.usage.output_tokens
    },
    hashes: {
      input: sha256(event.input),
      output: sha256(event.output)
    }
  });
  
  // Firma con la chiave privata del proprietario
  receipt.sign(ownerPrivateKey);
  
  // Invia al OpenClawScan API
  scanner.submit(receipt);
});
```

### Task grouping

```typescript
// Raggruppa receipt in un task
const task = scanner.startTask({
  name: "Smart Contract Audit — DeFi Protocol",
  description: "Full security audit of lending contract"
});

// ... l'agente lavora, le receipt vengono associate automaticamente ...

// Quando il task è completato
const link = await task.complete();
// → "https://openclawscan.xyz/task/abc123"
// → Condividi questo link con il committente
```

### Verifica locale (offline)

```typescript
import { verify } from '@openclawscan/sdk';

// Chiunque può verificare una receipt senza server
const isValid = verify({
  receipt: receiptJson,
  originalOutput: "il testo dell'output originale"
});
// → { signatureValid: true, hashMatch: true, timestamp: "2026-02-21T..." }
```

---

## 7. Explorer — Pagine

### 7.1 Homepage (openclawscan.xyz)

- Search bar: cerca agente per nome, ID, o owner
- Stats globali: totale agenti, totale receipt, receipt ultime 24h
- Feed: ultime receipt pubbliche in tempo reale (live ticker)
- "Register your agent" CTA

### 7.2 Pagina Agente (openclawscan.xyz/agent/:slug)

```
┌──────────────────────────────────────────────────┐
│  🤖 AuditBot-7x4k                               │
│  by @marco-rossi · Active since Feb 2026         │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ 1,247    │ │ 89       │ │ $342.50  │         │
│  │ receipts │ │ tasks    │ │ spent    │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│                                                  │
│  Models: Sonnet 4.5 (72%), Haiku 4.5 (28%)      │
│  Top tools: web_search, slither, file_write      │
│  Specialization: Smart Contract Auditing         │
│                                                  │
│  ── Recent Activity ──────────────────────────── │
│                                                  │
│  📄 Task: DeFi Audit #47        2 hours ago     │
│     12 receipts · 8min · $1.80 · ✓ verified     │
│                                                  │
│  📄 Task: Token Review #46      5 hours ago     │
│     8 receipts · 4min · $0.95 · ✓ verified      │
│                                                  │
│  🔧 tool_call: web_search       6 hours ago     │
│     Sonnet 4.5 · 0.8s · $0.003                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.3 Pagina Receipt (openclawscan.xyz/receipt/:id)

```
┌──────────────────────────────────────────────────┐
│  Receipt rcpt_a7x4k9m2                           │
│  ✅ Signature verified                           │
│                                                  │
│  Agent:     AuditBot-7x4k (@marco-rossi)        │
│  Time:      Feb 21, 2026 14:30:00 UTC           │
│  Action:    tool_call → web_search              │
│  Duration:  3.4s                                 │
│  Model:     claude-sonnet-4-5 (Anthropic)       │
│  Tokens:    1,847 in / 3,291 out                │
│  Cost:      $0.038                               │
│  Task:      DeFi Audit #47                       │
│                                                  │
│  ── Hashes ───────────────────────────────────── │
│  Input:  sha256:a3f8c1e9b2d4...                 │
│  Output: sha256:d91b7e3f5a82...                 │
│                                                  │
│  ── Signature ────────────────────────────────── │
│  Algorithm: Ed25519                              │
│  Public Key: pk_8k2mN7x...                      │
│  Signature:  sig_x8k2mP9q...                    │
│                                                  │
│  [Verify with original data]  [Copy receipt JSON]│
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.4 Pagina Task (openclawscan.xyz/task/:slug)

La pagina che il committente vede quando l'agente condivide il link.

```
┌──────────────────────────────────────────────────┐
│  Task: DeFi Audit #47                            │
│  Agent: AuditBot-7x4k · ✅ All receipts verified│
│                                                  │
│  Duration: 12 min                                │
│  Total cost: $2.30                               │
│  Receipts: 12                                    │
│  Models: Sonnet 4.5                              │
│                                                  │
│  ── Timeline ─────────────────────────────────── │
│                                                  │
│  14:30:00  🔧 web_search         0.8s   $0.003  │
│  14:30:04  🔧 web_search         1.2s   $0.005  │
│  14:30:12  🔧 file_read          0.3s   $0.001  │
│  14:31:05  🔧 slither_analysis   45.2s  $0.12   │
│  14:32:30  🤖 code_review        120s   $0.89   │
│  14:34:45  🔧 web_search         0.9s   $0.004  │
│  14:35:02  🤖 report_generation  95s    $0.78   │
│  ...                                             │
│                                                  │
│  [Download all receipts JSON]  [Verify all]      │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.5 Pagina Verifica (openclawscan.xyz/verify)

```
┌──────────────────────────────────────────────────┐
│  🔍 Verify a Receipt                             │
│                                                  │
│  Paste a receipt JSON or upload a file:           │
│  ┌──────────────────────────────────────────┐    │
│  │                                          │    │
│  │  { "receipt_id": "rcpt_...", ... }       │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Optional: paste the original output to verify   │
│  hash match:                                     │
│  ┌──────────────────────────────────────────┐    │
│  │  (original output text)                  │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [Verify]                                        │
│                                                  │
│  Result:                                         │
│  ✅ Signature: Valid (Ed25519)                   │
│  ✅ Hash match: Output matches receipt           │
│  ✅ Timestamp: Feb 21, 2026 14:30:00 UTC        │
│  ✅ Agent: AuditBot-7x4k (registered)           │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 8. API Reference

### Authentication
- SDK → API: API key nell'header `Authorization: Bearer cs_live_...`
- Explorer → API: Nessuna auth per lettura pubblica, Supabase Auth per gestione

### Endpoints

```
── SDK Endpoints (autenticati) ──────────────────────

POST   /api/receipts
       Body: { receipt JSON firmato }
       → 201 { receipt_id, explorer_url }

POST   /api/tasks
       Body: { agent_id, name, description }
       → 201 { task_id, slug }

PATCH  /api/tasks/:id
       Body: { status: "completed" }
       → 200 { task_id, share_url }

POST   /api/tasks/:id/link
       Body: { expires_in_hours?: number }
       → 201 { url: "openclawscan.xyz/task/abc123", token }

── Explorer Endpoints (pubblici) ─────────────────────

GET    /api/agents/:slug
       → 200 { agent profile + stats }

GET    /api/agents/:slug/feed
       Query: ?page=1&limit=20&type=tool_call
       → 200 { receipts[], has_more }

GET    /api/receipts/:id
       → 200 { full receipt }

GET    /api/tasks/:slug
       → 200 { task + receipts timeline }

POST   /api/verify
       Body: { receipt: JSON, original_output?: string }
       → 200 { signature_valid, hash_match, details }

GET    /api/search
       Query: ?q=auditbot
       → 200 { agents[], receipts[] }

GET    /api/stats
       → 200 { total_agents, total_receipts, receipts_24h }

── Owner Endpoints (autenticati via Supabase) ────────

POST   /api/agents
       Body: { name, gateway_url, description }
       → 201 { agent_id, api_key, slug }

GET    /api/me/agents
       → 200 { agents[] }

PATCH  /api/agents/:id
       Body: { description?, is_public?, ... }
       → 200 { agent }

GET    /api/me/agents/:id/receipts
       Query: ?visibility=all (owner sees private too)
       → 200 { receipts[] }
```

---

## 9. Privacy Model

| Livello | Chi vede | Quando usarlo |
|---------|----------|---------------|
| **private** | Solo il proprietario dell'agente | Default. Lavoro interno, testing |
| **task_only** | Chi ha il link del task | Condivisione con committente |
| **public** | Chiunque sull'Explorer | Costruire reputazione pubblica |

Il proprietario può cambiare la visibilità di qualsiasi receipt in qualsiasi momento.

Le receipt **non contengono mai** input o output raw — solo gli hash SHA-256. La privacy del contenuto è garantita a livello di protocollo.

---

## 10. Monetizzazione

| Tier | Prezzo | Limiti |
|------|--------|--------|
| **Free** | €0 | 1 agente, 1.000 receipt/mese, profilo pubblico, verifica |
| **Pro** | €4.99/mo | Agenti illimitati, receipt illimitate, task link personalizzati, export JSON/CSV, statistiche avanzate, badge "Pro Verified" |
| **API** | €19.99/mo | Tutto Pro + API access per marketplace/terze parti, webhook su nuove receipt, embed widget per siti esterni |

Il tier API è pensato per i marketplace (WhiteClaws, ClawMarket, ecc.) che vogliono integrare i dati OpenClawScan nei loro prodotti.

---

## 11. Build Phases

### Phase 1 — SDK Core + Receipt API (Settimane 1-3)
**Goal:** Un agente OpenClaw genera receipt firmate e le salva.

- [ ] Progetto Next.js con Supabase
- [ ] Schema database (owners, agents, receipts)
- [ ] Ed25519 keypair generation per owner
- [ ] SDK core: intercetta eventi Gateway WebSocket
- [ ] SHA-256 hashing pipeline
- [ ] Firma Ed25519 delle receipt
- [ ] POST /api/receipts endpoint
- [ ] Verifica firma server-side
- [ ] CLI tool: `openclawscan init`, `openclawscan verify`
- [ ] Test con agente OpenClaw reale

**Deliverable:** SDK funzionante che genera receipt firmate per un agente OpenClaw.

### Phase 2 — Explorer MVP (Settimane 4-6)
**Goal:** Chiunque può cercare un agente e vedere le sue receipt.

- [ ] Landing page openclawscan.xyz
- [ ] Registrazione owner (GitHub OAuth)
- [ ] Dashboard owner: registra agente, ottieni API key
- [ ] Pagina agente pubblica (/agent/:slug)
- [ ] Pagina receipt (/receipt/:id)
- [ ] Feed azioni agente con paginazione
- [ ] Search (per nome agente, owner)
- [ ] Stats globali homepage
- [ ] Deploy su Vercel

**Deliverable:** Explorer funzionante dove si possono cercare agenti e visualizzare receipt.

### Phase 3 — Tasks + Sharing (Settimane 7-9)
**Goal:** Gli agenti possono raggruppare receipt in task e condividere link verificabili.

- [ ] Task creation/completion nel SDK
- [ ] Task timeline page (/task/:slug)
- [ ] Link condivisibili con scadenza opzionale
- [ ] Pagina verifica pubblica (/verify)
- [ ] Download receipt in JSON
- [ ] Visibilità receipt (private/task_only/public)
- [ ] Statistiche agente (AgentStats materializzata)
- [ ] Pagina profilo agente completa con reputation

**Deliverable:** Flusso completo SDK→task→link→verifica funzionante.

### Phase 4 — Polish + Launch (Settimane 10-12)
**Goal:** Prodotto pronto per il lancio pubblico.

- [ ] Stripe per tiers Pro/API
- [ ] Onboarding tutorial
- [ ] Documentazione SDK
- [ ] API docs per marketplace
- [ ] Mobile responsive
- [ ] Performance optimization (caching, indicizzazione)
- [ ] ProductHunt preparation
- [ ] OpenClaw community announcement
- [ ] Social media assets

**Deliverable:** OpenClawScan live, pubblico, monetizzato.

---

## 12. Repo Structure

```
openclawscan/
├── apps/
│   └── web/                        # Next.js Explorer + API
│       ├── src/
│       │   ├── app/
│       │   │   ├── (public)/       # Pagine pubbliche
│       │   │   │   ├── agent/[slug]/
│       │   │   │   ├── receipt/[id]/
│       │   │   │   ├── task/[slug]/
│       │   │   │   ├── verify/
│       │   │   │   └── search/
│       │   │   ├── (dashboard)/    # Area owner (protetta)
│       │   │   │   ├── agents/
│       │   │   │   ├── settings/
│       │   │   │   └── billing/
│       │   │   ├── api/            # API Routes
│       │   │   │   ├── receipts/
│       │   │   │   ├── agents/
│       │   │   │   ├── tasks/
│       │   │   │   ├── verify/
│       │   │   │   ├── search/
│       │   │   │   └── stats/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx        # Landing
│       │   ├── components/
│       │   │   ├── ui/             # Shared (shadcn)
│       │   │   ├── explorer/       # Receipt viewer, agent profile
│       │   │   ├── dashboard/      # Owner area
│       │   │   └── verify/         # Verification UI
│       │   ├── lib/
│       │   │   ├── crypto/         # Ed25519, SHA-256 server-side
│       │   │   ├── supabase/       # DB client
│       │   │   └── utils/
│       │   ├── hooks/
│       │   ├── store/              # Zustand
│       │   └── types/
│       ├── package.json
│       └── next.config.js
│
├── packages/
│   └── sdk/                        # @openclawscan/sdk
│       ├── src/
│       │   ├── index.ts            # Main export
│       │   ├── scanner.ts          # Core: event listener + receipt gen
│       │   ├── receipt.ts          # Receipt builder
│       │   ├── crypto.ts           # Ed25519 sign/verify, SHA-256
│       │   ├── gateway.ts          # OpenClaw WebSocket client
│       │   ├── task.ts             # Task grouping
│       │   ├── api.ts              # HTTP client per OpenClawScan API
│       │   └── types.ts            # TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── packages/
│   └── verify/                     # @openclawscan/verify (lightweight)
│       ├── src/
│       │   ├── index.ts            # verify(receipt, originalData?)
│       │   └── crypto.ts           # Solo verifica, no firma
│       └── package.json
│
├── supabase/
│   └── migrations/
│
├── docs/                           # Documentazione pubblica
│   ├── sdk.md
│   ├── api.md
│   ├── receipt-format.md
│   └── integration-guide.md
│
├── .env.example
├── turbo.json                      # Turborepo config
├── package.json
└── README.md
```

---

## 13. Key Dependencies

| Package | Purpose | License |
|---------|---------|---------|
| tweetnacl | Ed25519 sign/verify | Public domain |
| next | Web app framework | MIT |
| @supabase/supabase-js | Database + Auth | MIT |
| zustand | State management | MIT |
| tailwindcss | Styling | MIT |
| turborepo | Monorepo management | MIT |
| zod | Schema validation | MIT |

Zero dipendenze pesanti. Nessuna blockchain per l'MVP (futuro: Merkle tree on-chain come upgrade).

---

## 14. Security Considerations

- **Chiavi private** mai inviate al server. L'SDK firma localmente, il server verifica.
- **API keys** hashate nel DB, revocabili dal dashboard.
- **Receipt immutabili**: una volta salvate, non possono essere modificate o cancellate (append-only).
- **Rate limiting**: 100 receipt/minuto per agente (Free), illimitate (Pro).
- **Validazione server-side**: ogni receipt viene verificata (firma + schema) prima del salvataggio.

---

## 15. Future Roadmap (post-MVP)

| Feature | Quando | Descrizione |
|---------|--------|-------------|
| On-chain anchoring | v1.1 | Merkle tree su Base L2 per ancorare batch di receipt |
| Multi-framework | v1.2 | Proxy HTTP per LangChain, CrewAI, qualsiasi agente |
| Marketplace widget | v1.3 | Embed della reputation in siti esterni |
| Dispute resolution | v2.0 | Flusso per contestare un task con prove |
| ERC-8004 integration | v2.0 | Collega profilo OpenClawScan a identità on-chain |
| Receipt standard RFC | v2.0 | Proposta di standard aperto per receipt agenti |

---

## 16. Competitive Position

| Feature | OpenClawScan | 8004scan | Agentscan | Langfuse | PEAC |
|---------|:--------:|:--------:|:---------:|:--------:|:----:|
| Traccia azioni dettagliate | ✅ | ❌ | ❌ | ✅ | ❌ |
| Firma crittografica | ✅ | ❌ | ❌ | ❌ | ✅ |
| Explorer pubblico | ✅ | ✅ | ✅ | ❌ | ❌ |
| Verifica da terzi | ✅ | ❌ | ❌ | ❌ | ✅ |
| Reputazione su azioni reali | ✅ | feedback only | feedback only | ❌ | ❌ |
| Task condivisibili | ✅ | ❌ | ❌ | ❌ | ❌ |
| Privacy (hash, no raw) | ✅ | n/a | n/a | ❌ (salva raw) | ✅ |
| Focus OpenClaw | ✅ | ❌ | ❌ | ❌ | ❌ |
| Installazione 5 min | ✅ | n/a | n/a | ✅ | ❌ |

**Unico a OpenClawScan:** La combinazione di tracking azioni granulare + firma crittografica + explorer pubblico + task condivisibili. Nessun altro ha tutti e quattro.

---

## 17. Success Metrics

| Metrica | Mese 3 | Mese 6 | Mese 12 |
|---------|--------|--------|---------|
| Agenti registrati | 100 | 500 | 2,000 |
| Receipt generate | 50,000 | 500,000 | 5,000,000 |
| Task condivisi | 500 | 5,000 | 50,000 |
| Verifiche eseguite | 200 | 2,000 | 20,000 |
| Pro subscribers | 20 | 100 | 500 |
| API subscribers | 5 | 20 | 100 |
| MRR | €120 | €900 | €4,500 |

---

*Document created: February 21, 2026*
*Status: Ready for development*
