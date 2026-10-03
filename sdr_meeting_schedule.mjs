import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const LEADS_FILE = 'leads-qualificados.json';
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });

function load() { return JSON.parse(readFileSync('leads-qualificados.json', 'utf8')); }
function save(d) { writeFileSync('leads-qualificados.json', JSON.stringify(d, null, 2)); }
function todayISO() { return new Date().toISOString().split('T')[0]; }

async function send(to, subject, text) {
  await transporter.sendMail({ from: `"Gustavo - Pindorama" <${process.env.GMAIL_USER}>`, to, subject, text });
  console.log('EMAIL OK:', to);
}

function load() { return JSON.parse(readFileSync('leads-qualificados.json', 'utf8')); }
function save(d) { writeFileSync('leads-qualificados.json', JSON.stringify(d, null, 2)); }
function todayISO() { return new Date().toISOString().split('T')[0]; }

const leads = load();
const today = todayISO();

// AGENDA REUNIÃO (simula agendamento após feedback positivo de amostra)
const ready = load().filter(l => l.sdr_stage === 'aguarda_feedback_amostra' && l.sample_feedback === 'positivo');

for (const l of ready) {
  // Simula agendamento (em produção: integração Calendly/Cal.com)
  l.sdr_stage = 'reuniao_agendada';
  l.meeting_scheduled = true;
  l.meeting_date = new Date(Date.now() + 2*86400000).toISOString().split('T')[0];
  l.meeting_type = 'virtual';
  l.sdr_stage = 'reuniao_agendada';
  l.sdr_last_activity = today;
  l.sdr_next_action = 'envia_proposta';
  l.sdr_next_action_date = new Date(Date.now() + 1*86400000).toISOString().split('T')[0];
  console.log('Reunião agendada (simulada):', l.name);
}

console.log('Agendamento de reuniões concluído');