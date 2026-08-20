import { existsSync, readFileSync, writeFileSync } from 'fs';
import { connect, sendText, isConnected } from './whatsapp.mjs';

const LIMIT = 4;
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

const targets = [
  { name: 'Seen Restaurant & Bar', phone: '+55 11 91635-3751', source: 'https://seensp.com/sobre-nos/' },
  { name: 'Adega Empório Mais Bebidas', phone: '(11) 94890-6829', source: 'https://adega-emporio-mais-bebidas.ueniweb.com/' },
  { name: '1966 PUB & Cocktail Bar', phone: '(11) 94559-1360', source: 'https://www.1966pub.com.br/' },
  { name: 'Bar2Go', phone: '(11) 98792-6744', source: 'https://bar2go.com.br/' },
  { name: 'The Black Horse', phone: '(11) 99186-6930', source: 'https://theblackhorse.com.br/' }
];

const leadsFile = 'leads-qualificados.json';
const logFile = 'whatsapp-send-log.json';
const leads = JSON.parse(readFileSync(leadsFile, 'utf8'));
const log = existsSync(logFile) ? JSON.parse(readFileSync(logFile, 'utf8')) : [];
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
  return lead && !lead.whatsappSent && !lead.doNotContact && !lead.bounced && target.source.startsWith('https://');
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
  const message = `Olá! Sou o Gustavo, da Pindorama, cachaça artesanal premium do Vale do Café (RJ). Vi o trabalho da ${target.name} e acredito que nossa linha pode combinar com a operação de vocês. Oferecemos amostra gratuita, treinamento da equipe, degustadora, bonificação no primeiro pedido, frete CIF e pagamento em 21 dias. Posso enviar a apresentação e a tabela comercial? Se não houver interesse, me avise e não volto a contatar por aqui.`;
  const result = await sendText(`${number}@s.whatsapp.net`, message);
  const messageId = result?.key?.id || null;
  const lead = leads.find((item) => item.name === target.name);
  lead.whatsappSent = true;
  lead.whatsappDate = today;
  lead.whatsappSource = target.source;
  log.push({ date: today, acceptedAt: new Date().toISOString(), status: 'accepted', name: target.name, phone: target.phone, source: target.source, messageId });
  writeFileSync(leadsFile, JSON.stringify(leads, null, 2));
  writeFileSync(logFile, JSON.stringify(log, null, 2));
  console.log(`WHATSAPP OK: ${target.name} <${target.phone}> id=${messageId}`);
  sent++;
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

console.log(`RESUMO WhatsApp: ${sent} aceitas; cota ${alreadyToday + sent}/${LIMIT}.`);
process.exit(0);
