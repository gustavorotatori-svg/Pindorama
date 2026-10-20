import { connect, sendText } from './whatsapp.mjs';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));
const number = '5547991298317';
const message = `Bom dia, Rafael! Gustavo aqui, da Pindorama.

Obrigado pelo retorno! Estou mandando a proposta da Pindorama para a Yacuy:

• Amostra grátis da linha completa para avaliação (Clássica, Ouro e Cobra Coral de jabuticaba)
• Primeiro pedido bonificado para teste
• Frete por nossa conta e 21 dias para pagar

Se fizer sentido testar, me passa o endereço de entrega e o CNPJ da Yacuy que já separo a caixa de amostras. Posso te mandar a tabela comercial agora mesmo.

(11) 9135-7790`;

const ok = [];
const fail = [];
try {
  await connect();
  const result = await sendText(`${number}@s.whatsapp.net`, message);
  ok.push(result?.key?.id || 'ok');
  console.log('WA OK: Rafael Yacuy id=' + ok[0]);
} catch (error) {
  fail.push(String(error?.message || error));
  console.log('WA ERR: ' + fail[0]);
}

const logFile = 'whatsapp-send-log.json';
const log = JSON.parse(readFileSync(logFile, 'utf8'));
const today = new Date().toISOString().slice(0, 10);
log.push({
  date: today,
  acceptedAt: new Date().toISOString(),
  status: ok.length ? 'accepted' : 'error',
  name: 'Yacuy Indústria de Erva-Mate (Rafael)',
  phone: '+55 (47) 99129-8317',
  source: 'inbound: pediu contato via WhatsApp 20/10',
  messageId: ok[0] || null,
  error: fail[0] || null,
});
writeFileSync(logFile, JSON.stringify(log, null, 2));

const lead = leads.find((l) => l.name === 'Yacuy Indústria de Erva-Mate');
if (lead) {
  lead.responded = true;
  lead.respondedAt = '2026-10-20';
  lead.hot = true;
  lead.contactName = 'Rafael';
  lead.contactRole = 'Yacuy (pediu contato WhatsApp)';
  lead.phone = '(47) 99129-8317';
  lead.phoneVerified = true;
  lead.whatsappSent = ok.length > 0;
  lead.whatsappDate = today;
  lead.context = ((lead.context || '') + ' | RESPONDEU 20/10 09:41: pediu chamar no WhatsApp 47 99129-8317').trim();
  writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
  console.log('LEAD ATUALIZADO: Yacuy');
}

process.exit(ok.length ? 0 : 1);
