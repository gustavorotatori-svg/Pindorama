import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { sendWithinEmailQuota } from './email-quota.mjs';

const to = process.env.RELATORIO_TO || 'cachaca011pindorama@gmail.com';
const cc = process.env.RELATORIO_CC || 'gusrotatori@icloud.com';
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

if (local.weekday !== 'Sun' || hour < 20 || hour > 23) {
  console.log(`Relatorio nao enviado: fora da janela de domingo 20:00-23:59 (${timeZone}).`);
  process.exit(0);
}
if (state.some(entry => entry.date === today && entry.status === 'accepted')) {
  console.log(`Relatorio ja enviado em ${today}; duplicata bloqueada.`);
  process.exit(0);
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
  text: 'Olá Gustavo,\n\nSegue o relatório semanal de prospecção (dashboard + resumo da semana).\n\nPindorama — Cachaça Artesanal\n(11) 91357-7900',
  attachments: [{ filename: basename(pdf), path: pdf }]
}), { allowReserved: true });
if (!quotaResult.sent) {
  console.log('Relatorio nao enviado: quota global de email atingida.');
  process.exit(0);
}
state.push({ date: today, acceptedAt: new Date().toISOString(), status: 'accepted', messageId: quotaResult.result.messageId, to, cc });
writeFileSync(stateFile, JSON.stringify(state, null, 2));
console.log('OK ' + quotaResult.result.messageId + ' -> ' + to + ' (cc: ' + cc + ')');
