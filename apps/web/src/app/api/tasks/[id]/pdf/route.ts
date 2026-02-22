import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonError } from '@/lib/auth';
import { authenticateSession } from '@/lib/session';
import PDFDocument from 'pdfkit';

/**
 * GET /api/tasks/[id]/pdf — Generate PDF audit report.
 * Requires auth (Pro/API tier).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth
  const session = await authenticateSession(req);
  if (!session) return jsonError('Unauthorized', 401);

  const taskId = params.id;

  // Fetch task
  const { data: task, error: taskErr } = await supabaseAdmin
    .from('tasks')
    .select(`
      id, slug, name, description, status,
      total_receipts, total_duration_ms, total_cost_usd,
      total_tokens_in, total_tokens_out,
      created_at, completed_at,
      agents!inner(agent_id, display_name, public_key),
      owners!inner(display_name)
    `)
    .eq('id', taskId)
    .eq('owner_id', session.ownerId)
    .single();

  if (taskErr || !task) return jsonError('Task not found', 404);

  // Fetch all receipts
  const { data: receipts } = await supabaseAdmin
    .from('receipts')
    .select(`
      receipt_id, timestamp, server_received_at,
      action_type, action_name, action_duration_ms,
      model_provider, model_name, tokens_in, tokens_out,
      cost_usd, input_sha256, output_sha256,
      sequence, signature_algorithm, signature_public_key, signature_value
    `)
    .eq('task_id', taskId)
    .order('sequence', { ascending: true });

  const agent = task.agents as any;
  const owner = task.owners as any;
  const allReceipts = receipts || [];

  // Generate PDF
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Audit Report — ${task.name}`,
      Author: `OpenClawScan`,
      Subject: `Task ${task.slug}`,
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const pdfPromise = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  // ─── Helpers ───
  const mono = 'Courier';
  const sans = 'Helvetica';
  const accent = '#16a34a';
  const dim = '#666666';
  const dark = '#111111';

  function drawLine(y: number) {
    doc.strokeColor('#dddddd').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
  }

  function formatDuration(ms: number) {
    if (ms < 1000) return `${ms}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1)}s`;
    return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  }

  function formatDate(ts: string) {
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }

  // ─── Page 1: Cover ───
  doc.fontSize(10).font(mono).fillColor(accent).text('OpenClawScan', 50, 50);
  doc.fontSize(8).fillColor(dim).text('AUDIT REPORT', 50, 65);

  drawLine(85);

  doc.fontSize(22).font(sans + '-Bold').fillColor(dark).text(task.name, 50, 105);

  if (task.description) {
    doc.fontSize(10).font(sans).fillColor(dim).text(task.description, 50, 135, { width: 495 });
  }

  let y = task.description ? 165 : 145;

  // Task meta
  const meta = [
    ['Task ID', task.slug],
    ['Status', task.status.toUpperCase()],
    ['Agent', `${agent.display_name} (${agent.agent_id})`],
    ['Owner', owner.display_name],
    ['Started', formatDate(task.created_at)],
    ['Completed', task.completed_at ? formatDate(task.completed_at) : '—'],
    ['Total receipts', String(task.total_receipts || allReceipts.length)],
    ['Total duration', formatDuration(task.total_duration_ms || 0)],
    ['Total cost', `$${(task.total_cost_usd || 0).toFixed(3)}`],
    ['Total tokens', `${((task.total_tokens_in || 0) + (task.total_tokens_out || 0)).toLocaleString()}`],
    ['Verification URL', `https://openclawscan.xyz/task/${task.slug}`],
  ];

  for (const [label, value] of meta) {
    doc.fontSize(8).font(sans).fillColor(dim).text(label, 50, y, { width: 120 });
    doc.fontSize(9).font(label === 'Status' ? sans + '-Bold' : mono)
      .fillColor(label === 'Status' && task.status === 'completed' ? accent : dark)
      .text(value, 170, y, { width: 375 });
    y += 16;
  }

  drawLine(y + 8);
  y += 20;

  // Integrity summary
  const gaps: number[] = [];
  allReceipts.forEach((r, i) => {
    if (r.sequence !== i) gaps.push(i);
  });

  doc.fontSize(10).font(sans + '-Bold').fillColor(dark).text('Integrity Summary', 50, y);
  y += 18;

  const checks = [
    ['Receipts signed', `${allReceipts.length}/${allReceipts.length} (Ed25519)`],
    ['Sequence gaps', gaps.length === 0 ? `None detected (seq #0 → #${allReceipts.length - 1})` : `${gaps.length} gap(s) detected at: ${gaps.join(', ')}`],
    ['Signature algorithm', 'Ed25519'],
    ['Hash algorithm', 'SHA-256'],
    ['Agent public key', agent.public_key],
  ];

  for (const [label, value] of checks) {
    doc.fontSize(8).font(sans).fillColor(dim).text(label, 50, y, { width: 120 });
    doc.fontSize(8).font(mono).fillColor(dark).text(value, 170, y, { width: 375 });
    y += 14;
  }

  // ─── Page 2+: Receipt table ───
  doc.addPage();
  y = 50;

  doc.fontSize(10).font(sans + '-Bold').fillColor(dark).text('Action Log', 50, y);
  y += 20;

  // Table header
  const cols = [50, 80, 140, 250, 350, 410, 470];
  const headers = ['#', 'Time', 'Type', 'Name', 'Duration', 'Cost', 'Tokens'];
  doc.fontSize(7).font(sans + '-Bold').fillColor(dim);
  headers.forEach((h, i) => doc.text(h, cols[i], y, { width: 60 }));
  y += 12;
  drawLine(y);
  y += 4;

  for (const r of allReceipts) {
    if (y > 750) {
      doc.addPage();
      y = 50;
      // Repeat header
      doc.fontSize(7).font(sans + '-Bold').fillColor(dim);
      headers.forEach((h, i) => doc.text(h, cols[i], y, { width: 60 }));
      y += 12;
      drawLine(y);
      y += 4;
    }

    const time = new Date(r.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const totalTokens = r.tokens_in + r.tokens_out;
    const row = [
      String(r.sequence),
      time,
      r.action_type,
      r.action_name,
      formatDuration(r.action_duration_ms),
      `$${r.cost_usd.toFixed(3)}`,
      totalTokens.toLocaleString(),
    ];

    doc.fontSize(7).font(mono).fillColor(dark);
    row.forEach((val, i) => doc.text(val, cols[i], y, { width: i === 3 ? 100 : 60 }));
    y += 12;
  }

  drawLine(y + 4);
  y += 16;

  // Totals
  doc.fontSize(8).font(sans + '-Bold').fillColor(dark).text('Total', 50, y);
  doc.font(mono).text(
    `${allReceipts.length} actions · ${formatDuration(task.total_duration_ms || 0)} · $${(task.total_cost_usd || 0).toFixed(3)} · ${((task.total_tokens_in || 0) + (task.total_tokens_out || 0)).toLocaleString()} tokens`,
    140, y
  );

  // ─── Receipt details pages ───
  for (const r of allReceipts) {
    doc.addPage();
    y = 50;

    doc.fontSize(10).font(sans + '-Bold').fillColor(dark).text(`Receipt #${r.sequence}: ${r.action_name}`, 50, y);
    y += 20;

    const details = [
      ['Receipt ID', r.receipt_id],
      ['Sequence', `#${r.sequence}`],
      ['Timestamp (agent)', formatDate(r.timestamp)],
      ['Timestamp (server)', formatDate(r.server_received_at)],
      ['Time drift', `${Math.abs(new Date(r.server_received_at).getTime() - new Date(r.timestamp).getTime())}ms`],
      ['', ''],
      ['Action type', r.action_type],
      ['Action name', r.action_name],
      ['Duration', formatDuration(r.action_duration_ms)],
      ['', ''],
      ['Model', `${r.model_name} (${r.model_provider})`],
      ['Tokens in', r.tokens_in.toLocaleString()],
      ['Tokens out', r.tokens_out.toLocaleString()],
      ['Cost', `$${r.cost_usd.toFixed(4)}`],
      ['', ''],
      ['Input hash (SHA-256)', r.input_sha256],
      ['Output hash (SHA-256)', r.output_sha256],
      ['', ''],
      ['Signature algorithm', r.signature_algorithm],
      ['Public key', r.signature_public_key],
      ['Signature', r.signature_value.slice(0, 64) + '...'],
    ];

    for (const [label, value] of details) {
      if (!label && !value) { y += 6; continue; }
      doc.fontSize(8).font(sans).fillColor(dim).text(label, 50, y, { width: 130 });
      doc.fontSize(7.5).font(mono).fillColor(dark).text(value, 185, y, { width: 360 });
      y += 13;
    }
  }

  // ─── Final page: footer ───
  doc.addPage();
  y = 50;

  doc.fontSize(10).font(sans + '-Bold').fillColor(dark).text('Report Information', 50, y);
  y += 20;

  const footer = [
    ['Generated', new Date().toISOString()],
    ['Generator', 'OpenClawScan v1.0.0'],
    ['Verification', `https://openclawscan.xyz/task/${task.slug}`],
    ['', ''],
    ['Note', 'This report contains cryptographic hashes and digital signatures that can be independently verified. Raw input/output data is not included — only SHA-256 hashes are stored. The Ed25519 signatures can be verified by anyone with the agent\'s public key.'],
  ];

  for (const [label, value] of footer) {
    if (!label && !value) { y += 8; continue; }
    doc.fontSize(8).font(sans).fillColor(dim).text(label, 50, y, { width: 80 });
    doc.fontSize(8).font(label === 'Note' ? sans : mono).fillColor(dark).text(value, 135, y, { width: 410 });
    y += label === 'Note' ? 50 : 14;
  }

  y += 20;
  doc.fontSize(7).font(sans).fillColor(dim).text(
    'OpenClawScan — Tamper-proof receipts for AI agents. MIT Licensed.',
    50, y, { align: 'center', width: 495 }
  );

  doc.end();

  const pdfBuffer = await pdfPromise;
  const body = new Uint8Array(pdfBuffer);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="openclawscan-audit-${task.slug}.pdf"`,
      'Content-Length': String(body.length),
    },
  });
}
