import { readFileSync, writeFileSync } from 'fs';
import { connect, sendText, isConnected } from './whatsapp.mjs';

const LEADS_FILE = 'leads-qualificados.json';
const MSG = `Olá! Sou o Gustavo, da Pindorama Cachaça Artesanal. Vi que a {nome} trabalha com bebidas e queria falar com quem cuida das compras. Podemos enviar uma amostra gratuita da nossa linha, com frete CIF e pedido teste a partir de uma caixa. Quem seria a pessoa certa? Se não fizer sentido, me avise e não volto a contatar.`;

function normalize(phone) {
  let digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 11) digits = '55' + digits;
  return digits;
}

const now = new Date();
const day = now.getDay();
const hour = now.getHours();
const allowed = day >= 1 && day <= 6 && hour >= 9 && hour < 20;
if (!allowed) {
  console.log('FORA DA JANELA WhatsApp (seg-sáb 9h-20h, nunca domingo) — abortando envio.');
  process.exit(0);
}

const localNow = new Date();
localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
const today = localNow.toISOString().split('T')[0];
const leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
const withPhone = leads.filter(lead =>
  (lead.phone || lead.whatsapp) &&
  !lead.whatsappSent &&
  !lead.doNotContact &&
  (lead.whatsappSource || lead.phoneSource)
);

const MAX_PER_DAY = 4;
const alreadySentToday = leads.filter(lead => lead.whatsappSent && lead.whatsappDate === today).length;
if (alreadySentToday >= MAX_PER_DAY) {
  console.log(`LIMITE DIÁRIO WhatsApp atingido (${alreadySentToday}/${MAX_PER_DAY} hoje).`);
  process.exit(0);
}

const sock = await connect();
if (!sock) {
  console.log('FALHA: não conectou ao WhatsApp');
  process.exit(1);
}

console.log('Aguardando conexão autenticada...');
const deadline = Date.now() + 300000;
while (!isConnected() && Date.now() < deadline) {
  await new Promise(resolve => setTimeout(resolve, 2000));
}
if (!isConnected()) {
  console.log('FALHA: tempo esgotado sem conexão');
  process.exit(1);
}

let sent = 0;
let notOnWhatsApp = 0;
let failed = 0;
const attemptedNumbers = new Set();

for (const lead of withPhone) {
  if (sent >= MAX_PER_DAY - alreadySentToday) break;
  const raw = lead.whatsapp || lead.phone;
  const number = normalize(raw);
  if (!/^55\d{11}$/.test(number) || attemptedNumbers.has(number)) {
    console.log('SKIP (número inválido ou duplicado): ' + lead.name);
    continue;
  }
  attemptedNumbers.add(number);

  try {
    const result = await sock.onWhatsApp(number);
    const exists = Array.isArray(result) && result.some(item => item.exists);
    if (!exists) {
      console.log('SEM WHATSAPP: ' + lead.name + ' <' + raw + '>');
      notOnWhatsApp++;
      continue;
    }

    await sendText(number + '@s.whatsapp.net', MSG.replace(/{nome}/g, lead.name));
    const reloaded = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
    const index = reloaded.findIndex(item => normalize(item.whatsapp || item.phone) === number);
    if (index !== -1) {
      reloaded[index].whatsappSent = true;
      reloaded[index].whatsappDate = today;
      reloaded[index].whatsappMessageType = 'initial_only';
      writeFileSync(LEADS_FILE, JSON.stringify(reloaded, null, 2) + '\n');
    }
    console.log('ENVIADO: ' + lead.name + ' <' + raw + '>');
    sent++;
    await new Promise(resolve => setTimeout(resolve, 4000));
  } catch (error) {
    console.log('ERRO: ' + lead.name + ' <' + raw + '>: ' + error.message);
    failed++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

console.log('--- RESUMO ---');
console.log('Enviados: ' + sent);
console.log('Sem WhatsApp: ' + notOnWhatsApp);
console.log('Erros: ' + failed);
process.exit(0);
