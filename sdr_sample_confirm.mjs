import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const LEADS_FILE = 'leads-qualificados.json';

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });

const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';

function load() { return JSON.parse(readFileSync('leads-qualificados.json', 'utf8')); }
function save(d) { writeFileSync('leads-qualificados.json', JSON.stringify(d, null, 2)); }
function todayISO() { return new Date().toISOString().split('T')[0]; }

async function send(to, subject, text) {
  await transporter.sendMail({ from: `"Gustavo - Pindorama" <${process.env.GMAIL_USER}>`, to, subject, text });
  console.log('EMAIL OK:', to);
}

const leads = load();
const today = todayISO();

// Processa respostas simuladas (em produção, viria de webhook/Gmail API)
const pending = leads.filter(l => l.sdr_stage === 'amostra_solicitada' && !l.sample_sent);

for (const l of pending) {
  // Em produção: verifica se lead respondeu pedindo amostra
  // Aqui simulamos: se lead respondeu "sim" (simulado via flag)
  if (l.sample_requested && !l.sample_sent) {
    // Envia confirmação de logística
    const text = `Perfeito! Vamos enviar a amostra da Pindorama.

Para o envio, preciso confirmar:
- Endereço completo de entrega
- Nome do responsável pelo recebimento
- WhatsApp de contato
- CNPJ (para nota fiscal)

A amostra sai **grátis** + 1º pedido bonificado (frete CIF, 21 dias para pagar).

Assim que tiver esses dados, envio o rastreio.

Abraço,
Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900`;

    // Simula envio (em produção: send())
    console.log('[SIMULADO] Confirmação logística para:', l.name, l.email);
    l.sdr_stage = 'aguarda_logistica_amostra';
    l.sdr_last_activity = new Date().toISOString().split('T')[0];
    l.sdr_next_action = 'aguarda_logistica_amostra';
  }
}

console.log('Processamento de amostras concluído');