import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { sendWithinEmailQuota } from './email-quota.mjs';

const to = process.env.RELATORIO_TO || 'gusrotatori@icloud.com';
const cc = process.env.RELATORIO_CC || undefined;
const timeZone = 'America/Sao_Paulo';
const local = new Intl.DateTimeFormat('en-CA', {
  timeZone,
  weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', hourCycle: 'h23'
}).formatToParts(new Date()).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
const today = `${local.year}-${local.month}-${local.day}`;
const hour = Number(local.hour);
const stateFile = 'report-send-log.json';
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : [];
const oneTimeException = process.env.REPORT_ONE_TIME_DATE === today;

// Semana civil começa no domingo (weekStart). Envia no máx 1x/semana;
// se o envio do domingo não aconteceu, roda no próximo horário disponível.
const weekStart = new Date();
weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 7) % 7));
const weekKey = weekStart.toISOString().slice(0, 10);
const sentThisWeek = state.some(e => e.status === 'accepted' && e.weekKey === weekKey);
if (!oneTimeException && sentThisWeek) {
  console.log(`Relatorio ja enviado na semana (${weekKey}); duplicata bloqueada.`);
  process.exit(0);
}
if (state.some(entry => entry.date === today && entry.status === 'accepted')) {
  if (!oneTimeException) {
    console.log(`Relatorio ja enviado em ${today}; duplicata bloqueada.`);
    process.exit(0);
  }
  console.log(`Excecao unica REPORT_ONE_TIME_DATE=${today}: reenviando apesar do log.`);
}
const pdf = join(process.cwd(), 'reports', `relatorio-${today}.pdf`);

if (!existsSync(pdf)) {
  console.error('PDF nao encontrado: ' + pdf);
  process.exit(1);
}

if (!process.env.GMAIL_APP_PASSWORD) {
  console.error('GMAIL_APP_PASSWORD ausente.');
  process.exit(1);
}
const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: process.env.GMAIL_APP_PASSWORD }
});
const quotaResult = await sendWithinEmailQuota(() => t.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to,
  cc,
  subject: `Relatório Semanal Pindorama — ${today}`,
  text: 'Olá Gustavo,\n\nSegue o relatório dominical da Pindorama com os últimos 7 dias, highlights dos clientes mais quentes e visão Year To Date.\n\nPindorama — Cachaça Artesanal\n(11) 91357-7900',
  attachments: [{ filename: basename(pdf), path: pdf }]
}), { allowReserved: true });
const forceSend = process.env.REPORT_FORCE === 'true' || process.env.REPORT_FORCE === '1';
let sent = false, result;
if (forceSend) {
  console.log('REPORT_FORCE: enviando sem usar a cota global (email explicito do dono).');
  result = await t.sendMail({
    from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
    to,
    cc,
    subject: `Relatório Semanal Pindorama — ${today}`,
    text: 'Olá Gustavo,\n\nSegue o relatório dominical da Pindorama com os últimos 7 dias, highlights dos clientes mais quentes e visão Year To Date.\n\nPindorama — Cachaça Artesanal\n(11) 91357-7900',
    attachments: [{ filename: basename(pdf), path: pdf }]
  });
  sent = true;
} else {
  sent = quotaResult.sent;
  result = quotaResult.result;
}
if (!sent) {
  console.log('Relatorio nao enviado: quota global de email atingida.');
  process.exit(0);
}
state.push({ date: today, weekKey, acceptedAt: new Date().toISOString(), status: 'accepted', messageId: result.messageId, to, cc });
writeFileSync(stateFile, JSON.stringify(state, null, 2));
console.log('OK ' + result.messageId + ' -> ' + to + (cc ? ' (cc: ' + cc + ')' : ''));
