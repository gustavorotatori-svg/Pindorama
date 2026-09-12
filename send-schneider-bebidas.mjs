import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import { sendWithinEmailQuota, emailQuotaStatus } from './email-quota.mjs';

const email = 'comercial@schneiderbebidas.com.br';
const file = 'leads-qualificados.json';
const leads = JSON.parse(readFileSync(file, 'utf8'));
const suppressed = JSON.parse(readFileSync('suppressed-emails.json', 'utf8')).map(x => String(x).toLowerCase());
const lead = leads.find(x => x.email?.toLowerCase() === email);
if (!lead || lead.email1 || suppressed.includes(email)) process.exit(console.log(JSON.stringify({ sent: false, reason: !lead ? 'missing' : lead.email1 ? 'duplicate' : 'suppressed' })));
if (!process.env.GMAIL_APP_PASSWORD) throw new Error('GMAIL_APP_PASSWORD ausente');

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: 'cachaca011pindorama@gmail.com', pass: process.env.GMAIL_APP_PASSWORD } });
const result = await sendWithinEmailQuota(() => transporter.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to: email,
  subject: 'Cachaça artesanal para o mix da Schneider Bebidas',
  text: `Olá, tudo bem?\n\nVi que a Schneider Bebidas atende Sousas com destilados, vinhos e cervejas premium, e já trabalha com cachaças conhecidas. Sou Gustavo, da Pindorama, produzida no Vale do Café.\n\nA linha pode ampliar o mix com uma opção artesanal premium. Posso enviar uma amostra gratuita para vocês avaliarem? Se outra pessoa cuida das compras, você pode me indicar?\n\nObrigado,\nGustavo\nPindorama - Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`
}));
if (!result.sent) process.exit(console.log(JSON.stringify({ sent: false, reason: result.reason, quota: emailQuotaStatus() })));
lead.email1 = true;
lead.date1 = '2026-08-30';
lead.status = 'contacted';
lead.messageId1 = result.result.messageId;
writeFileSync(file, JSON.stringify(leads, null, 2));
console.log(JSON.stringify({ sent: true, accepted: result.result.accepted, rejected: result.result.rejected, messageId: result.result.messageId, response: result.result.response, quota: emailQuotaStatus() }));
