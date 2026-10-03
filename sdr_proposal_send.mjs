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

// ENVIA PROPOSTA APÓS REUNIÃO
const ready = load().filter(l => l.sdr_stage === 'reuniao_agendada' && !l.proposal_sent);

for (const l of ready) {
  // Gera proposta baseada no tipo/porte
  const isDist = l.type && (l.type.includes('distribuidora') || l.type.includes('adega'));
  const basePrice = isDist ? 'R$ 89,00' : 'R$ 119,00'; // preço base garrafa 700ml
  
  const text = `Obrigado pela reunião!

Conforme alinhado, segue a **proposta comercial Pindorama**:

**Linha Clássica (700ml)**
- Pindorama Clássica: ${basePrice} (cachaça prata, 40% ABV)
- Pindorama Ouro: R$ ${isDist ? '129,00' : '159,00'} (carvalho 2 anos)
- Pindorama Cobra Coral: R$ ${isDist ? '149,00' : '189,00'} (jabuticaba, edição limitada)

**Condições Comerciais**
- Frete CIF (por nossa conta)
- Pagamento: 21 dias (boleto ou PIX)
- **1º pedido bonificado**: 10% de desconto + frete grátis
- Pedido mínimo: 6 garrafas (mix livre)
- Prazo de entrega: 5 dias úteis

**Validade da proposta: 30 dias**

Próximos passos:
1. Confirma volumes e mix
2. Enviamos nota fiscal + rastreio
3. Entrega em 5 dias úteis

Qualquer ajuste, me chama no WhatsApp (11) 91357-7900.

${SIG}`;

  // Simula envio
  console.log('[PROPOSTA ENVIADA]', l.name, l.email);
  // await send(l.email, 'Pindorama — Proposta Comercial (pós-reunião)', text);

  l.proposal_sent = true;
  l.proposal_sent_date = new Date().toISOString().split('T')[0];
  l.proposal_value = isDist ? 8900 : 11900; // base em centavos
  l.sdr_stage = 'proposta_enviada';
  l.sdr_last_activity = new Date().toISOString().split('T')[0];
  l.sdr_next_action = 'followup_proposta';
  l.sdr_next_action_date = new Date(Date.now() + 3*86400000).toISOString().split('T')[0];
  console.log('Proposta gerada:', l.name);
}

console.log('Geração de propostas concluída');