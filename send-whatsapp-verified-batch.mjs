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
  let digits = String(phone).replace(/\D/g, '');
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
  const availability = await sock.onWhatsApp(number);
  if (!Array.isArray(availability) || !availability.some((item) => item.exists)) {
    console.log(`SEM WHATSAPP: ${target.name} <${target.phone}>`);
    log.push({ date: today, checkedAt: new Date().toISOString(), status: 'not_on_whatsapp', name: target.name, phone: target.phone, source: target.source });
    writeFileSync(logFile, JSON.stringify(log, null, 2));
    continue;
  }
  const message = `Olá! Sou o Gustavo, da Pindorama — cachaça artesanal premium do Vale do Café (RJ), a mesma de Fasano, Hilton e Rosewood. Quero mandar uma amostra grátis para a ${target.name} testar, com o primeiro pedido bonificado. Posso combinar o envio? Se não interessar, me avisa que não volto a chamar.`;
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
}

console.log(`RESUMO WhatsApp: ${sent} aceitas; cota ${alreadyToday + sent}/${LIMIT}.`);
process.exit(0);
