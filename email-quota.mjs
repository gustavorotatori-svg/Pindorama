import { readFileSync, writeFileSync } from 'fs';

// Limite conservador para proteger a reputacao da conta e manter folga para
// follow-ups, respostas automaticas e o relatorio semanal.
export const EMAIL_LIMIT_24H = 20;
export const SEND_LOG_FILE = 'send-log.json';

function loadLog() {
  try {
    const data = JSON.parse(readFileSync(SEND_LOG_FILE, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function recentEntries(now = Date.now()) {
  const cutoff = now - 24 * 60 * 60 * 1000;
  return loadLog().filter(timestamp => typeof timestamp === 'number' && timestamp >= cutoff);
}

export function emailQuotaStatus(now = Date.now()) {
  const used = recentEntries(now).length;
  return { used, limit: EMAIL_LIMIT_24H, remaining: Math.max(0, EMAIL_LIMIT_24H - used) };
}

export function emailQuotaAvailable() {
  const status = emailQuotaStatus();
  if (status.remaining === 0) {
    console.log(`QUOTA GUARD: ${status.used}/${status.limit} saidas na janela movel de 24h.`);
    return false;
  }
  return true;
}

export function recordEmailOutput(timestamp = Date.now()) {
  const entries = recentEntries(timestamp);
  entries.push(timestamp);
  writeFileSync(SEND_LOG_FILE, JSON.stringify(entries, null, 2));
}

export async function sendWithinEmailQuota(send) {
  if (!emailQuotaAvailable()) return { sent: false, reason: 'quota' };
  const result = await send();
  recordEmailOutput();
  return { sent: true, result };
}
