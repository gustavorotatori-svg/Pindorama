import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import { sendWithinEmailQuota, emailQuotaStatus } from './email-quota.mjs';

const LEADS_FILE = 'leads-qualificados.json';
const SUPPRESSED_FILE = 'suppressed-emails.json';
const MAIL_USER = process.env.GMAIL_USER || 'cachaca011pindorama@gmail.com';
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const TODAY = '2026-09-01';

if (!MAIL_PASS) throw new Error('GMAIL_APP_PASSWORD ausente');

const messages = [
  {
    email: 'operacao@letsbeer.com.br',
    subject: 'Pindorama na seleção de cachaças da Let’s Beer',
    text: `Olá, tudo bem?\n\nVi que a Let’s Beer reúne bar, empório e eventos, além de trabalhar com cachaças e outros destilados. Sou Gustavo, da Pindorama, cachaça artesanal produzida no Vale do Café.\n\nPosso enviar uma amostra gratuita para avaliação? Se outra pessoa cuida das compras de destilados, você pode me indicar?\n\nObrigado,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`
  },
  {
    email: 'contato@acasadoprodutor.com.br',
    subject: 'Uma amostra Pindorama para A Casa do Produtor',
    text: `Olá, tudo bem?\n\nVi que A Casa do Produtor trabalha com produtos artesanais brasileiros e mantém uma seleção de cachaças. Sou Gustavo, da Pindorama, produzida no Vale do Café.\n\nGostaria de enviar uma amostra gratuita para vocês avaliarem a linha. Posso tratar disso por este e-mail ou há outra pessoa responsável pelas compras?\n\nObrigado,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`
  },
  {
    email: 'cachacarocadegarca@rocadegarca.com.br',
    subject: 'Amostra Pindorama para a seleção da Roça de Garça',
    text: `Olá, tudo bem?\n\nVi que a Roça de Garça é dedicada a cachaças artesanais e premium. Sou Gustavo, da Pindorama, cachaça artesanal produzida no Vale do Café.\n\nPosso enviar uma amostra gratuita para vocês conhecerem e avaliarem a linha?\n\nObrigado,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`
  }
];

const load = file => JSON.parse(readFileSync(file, 'utf8'));
const save = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2));
const leads = load(LEADS_FILE);
const suppressed = new Set(load(SUPPRESSED_FILE).map(value => String(value).toLowerCase()));
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const outcomes = [];

for (const message of messages) {
  const email = message.email.toLowerCase();
  const lead = leads.find(item => String(item.email || '').toLowerCase() === email);
  if (!lead || lead.email1 || suppressed.has(email) || lead.emailVerified !== true) {
    outcomes.push({ email, sent: false, reason: !lead ? 'missing' : lead.email1 ? 'duplicate' : suppressed.has(email) ? 'suppressed' : 'unverified' });
    continue;
  }

  try {
    const quotaResult = await sendWithinEmailQuota(() => transporter.sendMail({
      from: `"Gustavo - Pindorama" <${MAIL_USER}>`,
      to: email,
      subject: message.subject,
      text: message.text
    }));
    if (!quotaResult.sent) {
      outcomes.push({ email, sent: false, reason: quotaResult.reason });
      break;
    }
    const result = quotaResult.result;
    lead.email1 = true;
    lead.date1 = TODAY;
    lead.status = 'contacted';
    lead.messageId1 = result.messageId;
    lead.smtpResponse1 = result.response;
    save(LEADS_FILE, leads);
    outcomes.push({ email, sent: true, accepted: result.accepted, rejected: result.rejected, messageId: result.messageId, response: result.response });
  } catch (error) {
    outcomes.push({ email, sent: false, reason: 'smtp_error', code: error.code, responseCode: error.responseCode, response: error.response, message: error.message });
  }
}

console.log(JSON.stringify({ outcomes, quota: emailQuotaStatus() }, null, 2));
