import { readFileSync, writeFileSync, existsSync } from 'fs';

// Limite conservador para proteger a reputacao da conta e manter folga para
// follow-ups, respostas automaticas e o relatorio semanal.
export const EMAIL_LIMIT_24H = 45;
export const SEND_LOG_FILE = 'send-log.json';
const REPORT_LOG_FILE = 'report-send-log.json';

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

function reportReserveNeeded(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const hour = Number(parts.hour);
  const inReservationWindow =
    (parts.weekday === 'Sat' && hour >= 9) ||
    (parts.weekday === 'Sun' && hour <= 23);
  if (!inReservationWindow) return false;
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  try {
    const reports = existsSync(REPORT_LOG_FILE) ? JSON.parse(readFileSync(REPORT_LOG_FILE, 'utf8')) : [];
    return !reports.some(entry => entry.date === date && entry.status === 'accepted');
  } catch {
    return true;
  }
}

export function emailQuotaAvailable({ allowReserved = false } = {}) {
  const status = emailQuotaStatus();
  const reserve = !allowReserved && reportReserveNeeded() ? 1 : 0;
  if (status.remaining <= reserve) {
    console.log(`QUOTA GUARD: ${status.used}/${status.limit} saidas na janela movel de 24h.`);
    if (reserve) console.log('QUOTA GUARD: 1 saida reservada para o relatorio semanal obrigatorio.');
    return false;
  }
  return true;
}

export function recordEmailOutput(timestamp = Date.now()) {
  const entries = recentEntries(timestamp);
  entries.push(timestamp);
  writeFileSync(SEND_LOG_FILE, JSON.stringify(entries, null, 2));
}

export async function sendWithinEmailQuota(send, options = {}) {
  if (!emailQuotaAvailable(options)) return { sent: false, reason: 'quota' };
  const result = await send();
  recordEmailOutput();
  return { sent: true, result };
}
