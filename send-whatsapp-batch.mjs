import { readFileSync, writeFileSync } from 'fs';
import { connect, sendText, isConnected } from './whatsapp.mjs';

const LEADS_FILE = 'leads-qualificados.json';

const MSG = `Olá {nome}! Sou o Gustavo, da Pindorama — cachaça artesanal premium produzida em fazenda própria no Vale do Café (RJ). Já atendemos grupos como Fasano, Hilton e Rosewood, e oferecemos aos parceiros: amostra grátis, degustadoras para ações no seu estabelecimento, treinamento da equipe, bonificação no primeiro pedido e frete CIF com pagamento em 21 dias. Vocês estariam abertos a conhecer nossa linha? Posso mandar nossa tabela por aqui ou por email.`;

function normalize(phone) {
  let d = phone.replace(/[^0-9]/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return d;
}

const now = new Date();
const day = now.getDay();
const hour = now.getHours();
const ALLOWED = (day >= 1 && day <= 6) && hour >= 9 && hour < 20;
if (!ALLOWED) {
  console.log('FORA DA JANELA WhatsApp (seg-sab 9h-20h, nunca domingo) — abortando envio.');
  process.exit(0);
}

const EXTRA_LEADS = [
  { name: 'Point das Bebidas', phone: '(11) 96023-1738' },
  { name: 'Prabar Bebidas', phone: '(11) 99626-1147' }
];

const _d = new Date(); _d.setMinutes(_d.getMinutes() - _d.getTimezoneOffset()); const today = _d.toISOString().split('T')[0];

const leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
const withPhone = leads.filter(x => x.phone || x.whatsapp).concat(EXTRA_LEADS);

const MAX_PER_DAY = 4;
const alreadySentToday = leads.filter(x => x.whatsappSent && x.whatsappDate === today).length;
if (alreadySentToday >= MAX_PER_DAY) {
  console.log('LIMITE DIARIO WhatsApp atingido (' + alreadySentToday + '/' + MAX_PER_DAY + ' hoje) — abortando para nao travar a conta.');
  process.exit(0);
}

const sock = await connect();
if (!sock) { console.log('FALHA: nao conectou ao WhatsApp'); process.exit(1); }

console.log('Aguardando pareamento (escaneie o QR no navegador)...');
const deadline = Date.now() + 300000;
while (!isConnected() && Date.now() < deadline) {
  await new Promise(r => setTimeout(r, 2000));
}
if (!isConnected()) { console.log('FALHA: tempo esgotado sem conexao'); process.exit(1); }
console.log('Conectado! Enviando (cota restante hoje: ' + (MAX_PER_DAY - alreadySentToday) + ')...');
let sent = 0, notOnWhatsApp = 0, failed = 0;

const SKIP = ['Degusti Vinhos'];

for (const l of withPhone) {
  if (sent >= MAX_PER_DAY - alreadySentToday) { console.log('Cota diaria atingida (' + MAX_PER_DAY + ') — parando.'); break; }
  if (SKIP.some(s => l.name.includes(s))) { console.log('SKIP (já engajada): ' + l.name); continue; }
  const raw = l.phone || l.whatsapp;
  const num = normalize(raw);
  try {
    const res = await sock.onWhatsApp(num);
    const exists = Array.isArray(res) && res.some(r => r.exists);
    if (!exists) { console.log('SEM WHATSAPP: ' + l.name + ' <' + raw + '>'); notOnWhatsApp++; continue; }
    const jid = num + '@s.whatsapp.net';
    const firstName = l.name.split(' ')[0];
    await sendText(jid, MSG.replace(/{nome}/g, firstName));
    const reloaded = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
    const idx = reloaded.findIndex(x => (x.phone || x.whatsapp) === raw);
    if (idx !== -1) { reloaded[idx].whatsappSent = true; reloaded[idx].whatsappDate = today; writeFileSync(LEADS_FILE, JSON.stringify(reloaded, null, 2)); }
    console.log('ENVIADO: ' + l.name + ' <' + raw + '>');
    sent++;
    await new Promise(r => setTimeout(r, 4000));
  } catch(e) {
    console.log('ERRO: ' + l.name + ' <' + raw + '>: ' + e.message);
    failed++;
    await new Promise(r => setTimeout(r, 2000));
  }
}

console.log('\n--- RESUMO ---');
console.log('Enviados: ' + sent);
console.log('Sem WhatsApp: ' + notOnWhatsApp);
console.log('Erros: ' + failed);
process.exit(0);
