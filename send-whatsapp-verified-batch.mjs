import { existsSync, readFileSync, writeFileSync } from 'fs';
import { connect, sendText, isConnected } from './whatsapp.mjs';

const isRecoverableSessionNoise = (error) =>
  String(error?.message || error).includes('Decrypted message with closed session');

process.on('unhandledRejection', (reason) => {
  if (isRecoverableSessionNoise(reason)) {
    console.warn(`WHATSAPP SESSION WARN: ${reason.message || reason}`);
    return;
  }
  console.error('WHATSAPP UNHANDLED REJECTION:', reason);
  process.exitCode = 1;
});

const LIMIT = 15;
const timeZone = 'America/Sao_Paulo';
const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', hourCycle: 'h23'
}).formatToParts(new Date()).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
const today = `${parts.year}-${parts.month}-${parts.day}`;
const hour = Number(parts.hour);
if (!['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(parts.weekday) || hour < 9 || hour >= 20) {
  console.log('FORA DA JANELA WhatsApp (seg-sab 09:00-20:00 America/Sao_Paulo).');
  process.exit(0);
}

const leadsFile = 'leads-qualificados.json';
const logFile = 'whatsapp-send-log.json';
const queueFile = 'whatsapp-verified-queue.json';
const leads = JSON.parse(readFileSync(leadsFile, 'utf8'));
const log = existsSync(logFile) ? JSON.parse(readFileSync(logFile, 'utf8')) : [];
const targets = existsSync(queueFile) ? JSON.parse(readFileSync(queueFile, 'utf8')) : [];
const requestedNames = process.argv.slice(2);
const alreadyToday = log.filter((entry) => entry.date === today && entry.status === 'accepted').length;
if (alreadyToday >= LIMIT) {
  console.log(`LIMITE DIARIO WhatsApp atingido (${alreadyToday}/${LIMIT}).`);
  process.exit(0);
}

const normalize = (phone) => {
  const raw = String(phone);
  const candidates = raw.match(/\(?\d{2}\)?[\s.\-/]*\d{4,5}[-\s]?\d{4}/g) || [];
  const digitsOf = (c) => c.replace(/\D/g, '');
  const mobiles = candidates.filter((c) => {
    const d = digitsOf(c);
    return d.length >= 10 && d.length <= 11 && d.slice(-9).startsWith('9');
  });
  const chosen = (mobiles[0] || candidates[0] || raw);
  let digits = digitsOf(chosen);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits;
};
const eligible = targets.filter((target) => {
  const lead = leads.find((item) => item.name === target.name);
  const everMessaged = log.some((entry) => entry.name === target.name && entry.status === 'accepted');
  const suppressed = lead && (lead.whatsappSent || lead.doNotContact || lead.bounced);
  const explicitlyRequested = requestedNames.length === 0 || requestedNames.includes(target.name);
  return explicitlyRequested && target.status === 'queued' && target.notBefore <= today && !everMessaged && !suppressed && target.source.startsWith('https://');
});

if (!eligible.length) {
  console.log('Nenhum destinatario empresarial verificado elegivel.');
  process.exit(0);
}

const sock = await connect();
if (!sock) throw new Error('WhatsApp nao inicializado.');
const deadline = Date.now() + 120000;
while (!isConnected() && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 1000));
if (!isConnected()) throw new Error('WhatsApp nao autenticado.');

let sent = 0;
for (const target of eligible) {
  if (alreadyToday + sent >= LIMIT) break;
  const number = normalize(target.phone);
  if (!/^55\d{10,11}$/.test(number)) {
    console.log(`TELEFONE INVALIDO: ${target.name} <${target.phone}>`);
    continue;
  }
  const message = `Olá! Sou o Gustavo, da Pindorama — cachaça artesanal premium do Vale do Café (RJ), a mesma de Fasano, Hilton e Rosewood. Mando catálogo e tabela de preços da Pindorama para a ${target.name}. Posso enviar por aqui? Se não interessar, me avisa que não volto a chamar.`;
  try {
    const result = await sendText(`${number}@s.whatsapp.net`, message);
    const messageId = result?.key?.id || null;
    const lead = leads.find((item) => item.name === target.name);
    if (lead) {
      lead.whatsappSent = true;
      lead.whatsappDate = today;
      lead.whatsappSource = target.source;
    }
    target.status = 'sent';
    target.sentAt = new Date().toISOString();
    log.push({ date: today, acceptedAt: new Date().toISOString(), status: 'accepted', name: target.name, phone: target.phone, source: target.source, messageId });
    writeFileSync(leadsFile, JSON.stringify(leads, null, 2));
    writeFileSync(queueFile, JSON.stringify(targets, null, 2));
    writeFileSync(logFile, JSON.stringify(log, null, 2));
    console.log(`WHATSAPP OK: ${target.name} <${target.phone}> id=${messageId}`);
    sent++;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    const msg = String(error?.message || error).toLowerCase();
    const notOnWa = /not.?on.?whatsapp|does not exist|jid_not_in_whatsapp|account not found/.test(msg);
    console.log(`${notOnWa ? 'SEM WHATSAPP' : 'WHATSAPP ERR'}: ${target.name} <${target.phone}> — ${error?.message || error}`);
    log.push({ date: today, checkedAt: new Date().toISOString(), status: notOnWa ? 'not_on_whatsapp' : 'error', name: target.name, phone: target.phone, source: target.source, error: String(error?.message || error).slice(0, 200) });
    writeFileSync(logFile, JSON.stringify(log, null, 2));
    if (notOnWa) target.status = 'not_on_whatsapp';
    else break;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

console.log(`RESUMO WhatsApp: ${sent} aceitas; cota ${alreadyToday + sent}/${LIMIT}.`);
process.exit(0);
