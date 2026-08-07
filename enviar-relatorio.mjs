import nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { sendWithinEmailQuota } from './email-quota.mjs';

const to = process.env.RELATORIO_TO || 'gusrotartori@icloud.com';
const today = new Date().toLocaleDateString('en-CA');
const pdf = join(process.cwd(), 'reports', `relatorio-${today}.pdf`);

if (!existsSync(pdf)) {
  console.error('PDF nao encontrado: ' + pdf);
  process.exit(1);
}

const t = nodemailer.createTransport({ service: 'gmail', auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' } });
const quotaResult = await sendWithinEmailQuota(() => t.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to,
  subject: `Relatório Semanal Pindorama — ${today}`,
  text: 'Olá Gustavo,\n\nSegue o relatório semanal de prospecção (dashboard + resumo da semana).\n\nPindorama — Cachaça Artesanal\n(11) 91357-7900',
  attachments: [{ filename: basename(pdf), path: pdf }]
}));
if (!quotaResult.sent) {
  console.log('Relatorio nao enviado: quota global de email atingida.');
  process.exit(0);
}
console.log('OK ' + quotaResult.result.messageId + ' -> ' + to);
