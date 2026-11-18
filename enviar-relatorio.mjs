import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { sendWithinEmailQuota } from './email-quota.mjs';

const to = process.env.RELATORIO_TO || 'fabianavazcampos@hotmail.com';
const cc = process.env.RELATORIO_CC || 'gustavorotatori@gmail.com';
const reportUrl = process.env.RELATORIO_URL || 'https://gustavorotatori-svg.github.io/Pindorama/';

const timeZone = 'America/Sao_Paulo';
const local = new Intl.DateTimeFormat('en-CA', {
  timeZone,
  weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', hourCycle: 'h23'
}).formatToParts(new Date()).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});

const today = `${local.year}-${local.month}-${local.day}`;
const stateFile = 'report-send-log.json';
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : [];
const oneTimeException = process.env.REPORT_ONE_TIME_DATE === today;

// Semana civil (domingo como início) — no máximo 1 envio por semana (idempotente)
const now = new Date();
const weekStart = new Date(now);
weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 7) % 7));
const weekKey = weekStart.toISOString().slice(0, 10);
const sentThisWeek = state.some(e => e.status === 'accepted' && e.weekKey === weekKey);
if (!oneTimeException && sentThisWeek) {
  console.log(`Relatorio ja enviado na semana (${weekKey}); duplicata bloqueada.`);
  process.exit(0);
}
if (!oneTimeException && state.some(entry => entry.date === today && entry.status === 'accepted')) {
  console.log(`Relatorio ja enviado em ${today}; duplicata bloqueada.`);
  process.exit(0);
}
if (oneTimeException) {
  console.log(`Excecao unica REPORT_ONE_TIME_DATE=${today}: reenviando apesar do log.`);
}

if (!process.env.GMAIL_APP_PASSWORD) {
  console.error('GMAIL_APP_PASSWORD ausente.');
  process.exit(1);
}

// Gera dados e HTML atualizados (relatório desde o início)
try {
  if (existsSync(join(process.cwd(), 'scripts', 'generate-dashboard-data.mjs'))) {
    execFileSync(process.execPath, ['scripts/generate-dashboard-data.mjs'], { stdio: 'inherit' });
  }
  if (existsSync(join(process.cwd(), 'scripts', 'gerar-relatorio-html.mjs'))) {
    execFileSync(process.execPath, ['scripts/gerar-relatorio-html.mjs'], { stdio: 'inherit' });
  }
} catch (e) {
  console.warn('Aviso: falha ao gerar relatorio atualizado:', e?.message || e);
}

let summary = { sinceDate: null, totalLeads: 0, emails: { email1: 0, email2: 0, email3: 0, total: 0 }, responses: 0, whatsapp: { total: 0 } };
try {
  const data = JSON.parse(readFileSync(join(process.cwd(), 'dashboard-data.json'), 'utf8'));
  summary = {
    sinceDate: data.sinceDate || data.sinceBeginning?.firstDate || null,
    totalLeads: data.totalLeads || 0,
    emails: data.emails || summary.emails,
    responses: data.responses || 0,
    whatsapp: data.whatsapp || { total: 0 },
  };
} catch {}

const fmt = (d) => d ? `${String(d).slice(8,10)}/${String(d).slice(5,7)}/${String(d).slice(0,4)}` : 'o início';
const e = summary.emails || {};
const totalEmails = e.total ?? ((e.email1||0)+(e.email2||0)+(e.email3||0));
const taxa = (e.email1||0) > 0 ? ((summary.responses||0)/(e.email1||0)*100).toFixed(2).replace('.',',')+'%' : '0%';

const subject = `Relatório Pindorama — desde ${fmt(summary.sinceDate)} (atualizado em ${today})`;
const text = [
  'Olá,',
  '',
  `Segue o relatório de prospecção da Pindorama (cachaça artesanal), com informações consolidadas desde ${fmt(summary.sinceDate)} até ${today}.`,
  '',
  `• Total de leads: ${summary.totalLeads}`,
  `• Emails enviados: ${totalEmails} (E1: ${e.email1||0}, E2: ${e.email2||0}, E3: ${e.email3||0})`,
  `• Respostas/interesse: ${summary.responses||0} (taxa sobre E1: ${taxa})`,
  `• WhatsApp aceitos (acumulado): ${summary.whatsapp?.total || 0}`,
  '',
  `Relatório online (link fixo, atualizado automaticamente): ${reportUrl}`,
  '',
  'O arquivo HTML em anexo contém a versão atual do relatório.',
  '',
  'Pindorama — Cachaça Artesanal',
  '(11) 91357-7900'
].join('\n');

const htmlBody = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:640px">
  <p>Olá,</p>
  <p>Segue o relatório de prospecção da <b>Pindorama</b> (cachaça artesanal), com informações consolidadas <b>desde ${fmt(summary.sinceDate)}</b> até <b>${today}</b>.</p>
  <ul>
    <li><b>Total de leads:</b> ${summary.totalLeads}</li>
    <li><b>Emails enviados:</b> ${totalEmails} (E1: ${e.email1||0}, E2: ${e.email2||0}, E3: ${e.email3||0})</li>
    <li><b>Respostas/interesse:</b> ${summary.responses||0} (taxa sobre E1: ${taxa})</li>
    <li><b>WhatsApp aceitos (acumulado):</b> ${summary.whatsapp?.total || 0}</li>
  </ul>
  <p><b>Relatório online (link fixo, atualizado automaticamente):</b><br>
  <a href="${reportUrl}">${reportUrl}</a></p>
  <p>O arquivo HTML em anexo contém a versão atual do relatório.</p>
  <p style="margin-top:18px">Pindorama — Cachaça Artesanal<br>(11) 91357-7900</p>
</div>`;

const attachments = [];
const htmlPath = join(process.cwd(), 'relatorio', 'index.html');
if (existsSync(htmlPath)) attachments.push({ filename: `relatorio-pindorama-${today}.html`, path: htmlPath });
// Compatibilidade: se existir PDF do dia, anexa também
const pdfPath = join(process.cwd(), 'reports', `relatorio-${today}.pdf`);
if (existsSync(pdfPath)) attachments.push({ filename: `relatorio-pindorama-${today}.pdf`, path: pdfPath });

const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: process.env.GMAIL_APP_PASSWORD }
});

const sendMail = () => t.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to, cc, subject, text, html: htmlBody, attachments
});

const forceSend = process.env.REPORT_FORCE === 'true' || process.env.REPORT_FORCE === '1';
let sent = false, result;
if (forceSend) {
  console.log('REPORT_FORCE: enviando sem usar a cota global.');
  result = await sendMail();
  sent = true;
} else {
  const quotaResult = await sendWithinEmailQuota(sendMail, { allowReserved: true });
  sent = quotaResult.sent;
  result = quotaResult.result;
}

if (!sent) {
  console.log('Relatorio nao enviado: quota global de email atingida.');
  process.exit(0);
}

state.push({ date: today, weekKey, acceptedAt: new Date().toISOString(), status: 'accepted', messageId: result.messageId, to, cc, url: reportUrl });
writeFileSync(stateFile, JSON.stringify(state, null, 2));
console.log('OK ' + result.messageId + ' -> ' + to + (cc ? ' (cc: ' + cc + ')' : '') + ' | ' + reportUrl);
