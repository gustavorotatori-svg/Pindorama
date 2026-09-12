import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import { sendWithinEmailQuota, emailQuotaStatus } from './email-quota.mjs';

const email = 'contato@cestapremium.com.br';
const leadsFile = 'leads-qualificados.json';
const leads = JSON.parse(readFileSync(leadsFile, 'utf8'));
const suppressed = JSON.parse(readFileSync('suppressed-emails.json', 'utf8')).map(x => String(x).toLowerCase());
const lead = leads.find(x => x.email?.toLowerCase() === email);

if (!lead || lead.email1 || suppressed.includes(email)) {
  console.log(JSON.stringify({ sent: false, reason: !lead ? 'missing' : lead.email1 ? 'duplicate' : 'suppressed' }));
  process.exit(0);
}
if (!process.env.GMAIL_APP_PASSWORD) throw new Error('GMAIL_APP_PASSWORD ausente');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: process.env.GMAIL_APP_PASSWORD }
});

const result = await sendWithinEmailQuota(() => transporter.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to: email,
  subject: 'Pindorama em kits premium da Cesta Premium',
  text: `Olá, tudo bem?\n\nVi que a Cesta Premium trabalha com kits de bebidas e presentes corporativos, inclusive opções com cachaça. Sou Gustavo, da Pindorama, produzida no Vale do Café.\n\nAcredito que nossa linha possa compor kits premium e ações corporativas de vocês. Posso enviar uma amostra gratuita para avaliação? Se outra pessoa cuida da seleção de bebidas, você pode me indicar?\n\nObrigado,\nGustavo\nPindorama - Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`
}));

if (!result.sent) {
  console.log(JSON.stringify({ sent: false, reason: result.reason, quota: emailQuotaStatus() }));
  process.exit(0);
}

lead.email1 = true;
lead.date1 = '2026-08-30';
lead.status = 'contacted';
lead.messageId1 = result.result.messageId;
writeFileSync(leadsFile, JSON.stringify(leads, null, 2));
console.log(JSON.stringify({ sent: true, accepted: result.result.accepted, messageId: result.result.messageId, quota: emailQuotaStatus() }));
