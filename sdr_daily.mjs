import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const LEADS_FILE = 'leads-qualificados.json';
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });

function load() { return JSON.parse(readFileSync(LEADS_FILE, 'utf8')); }
function save(d) { writeFileSync(LEADS_FILE, JSON.stringify(d, null, 2)); }

async function send(to, subject, text) {
  await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
  console.log('EMAIL OK:', to);
}

function todayISO() { return new Date().toISOString().split('T')[0]; }

const leads = load();
const today = todayISO();

for (const l of leads) {
  // só leads do foco (RMSP+ABCD) com email verificado
  if (!l.emailVerified || !l.emailSource) continue;
  if (l.fora_foco) continue;

  const stage = l.sdr_stage || 'novo';

  // 1. FOLLOW-UP AMOSTRA (2 dias após email1)
  if (stage === 'contatado' && l.sdr_next_action === 'followup_amostra' && l.sdr_next_action_date <= today) {
    const text = `Olá! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium do Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood.

Vi que você recebeu nossa apresentação e queria saber: tem interesse em receber uma **amostra grátis** para avaliar a qualidade? O primeiro pedido sai **bonificado** (frete CIF + 21 dias para pagar).

Se tiver interesse, me passa:
- Endereço completo de entrega
- CNPJ
- WhatsApp do responsável pelo recebimento

Se não for o momento, sem problema — não volto a chamar.

${SIG}`;

    await send(l.email, 'Pindorama — amostra grátis + 1º pedido bonificado', text);

    l.sdr_stage = 'amostra_oferecida';
    l.sdr_last_activity = today;
    l.sdr_next_action = 'aguarda_resposta_amostra';
    l.sdr_next_action_date = null;
    l.followup_count = (l.followup_count || 0) + 1;
    console.log('Follow-up amostra enviado:', l.name);
  }

  // 2. AGUARDA RESPOSTA AMOSTRA — se não respondeu em 5 dias, 2º follow-up
  if (stage === 'amostra_oferecida' && l.last_reply_date === null) {
    const daysSince = l.sdr_last_activity ? Math.floor((new Date(today) - new Date(l.sdr_last_activity)) / 86400000) : 0;
    if (daysSince >= 5) {
      const text = `Olá! Tudo bem?

Seguindo: tem interesse na **amostra grátis** da Pindorama para testar no seu estabelecimento?

Lembrete: o primeiro pedido sai **bonificado** (frete CIF + 21 dias para pagar).

Se não for o momento, me avisa que não volto a chamar.

${SIG}`;

    await send(l.email, 'Pindorama — amostra grátis (segue)', text);
    l.sdr_last_activity = today;
    l.followup_count = (l.followup_count || 0) + 1;
    console.log('2º follow-up amostra:', l.name);
  }

  // 3. AMOSTRA SOLICITADA — confirmar envio e pedir logística
  if (stage === 'amostra_solicitada' && l.sample_requested && !l.sample_sent) {
    const text = `Perfeito! Vamos enviar a amostra.

Para o envio, preciso confirmar:
- Endereço completo de entrega
- Nome do responsável pelo recebimento
- WhatsApp de contato
- CNPJ (para nota fiscal)

A amostra sai **grátis** + 1º pedido bonificado (frete CIF, 21 dias).

${SIG}`;

    await send(l.email, 'Pindorama — confirmação de envio da amostra', text);
    l.sdr_stage = 'aguarda_logistica_amostra';
    l.sdr_last_activity = today;
    l.sdr_next_action = 'aguarda_logistica_amostra';
    console.log('Confirmação logística amostra:', l.name);
  }

  // 4. AMOSTRA ENVIADA — follow-up pós-entrega (3 dias)
  if (stage === 'amostra_enviada' && l.sample_sent && !l.sample_feedback) {
    const daysSince = l.sample_sent_date ? Math.floor((new Date(today) - new Date(l.sample_sent_date)) / 86400000) : 0;
    if (daysSince >= 3) {
      const text = `Olá! A amostra da Pindorama chegou?

Gostaria de saber sua impressão: o que achou da qualidade, aroma, sabor?

Se quiser, podemos agendar uma call rápida (15 min) para alinhar o primeiro pedido bonificado.

${SIG}`;

    await send(l.email, 'Pindorama — feedback da amostra', text);
    l.sdr_stage = 'aguarda_feedback_amostra';
    l.sdr_last_activity = today;
    l.followup_count = (l.followup_count || 0) + 1;
    console.log('Follow-up feedback amostra:', l.name);
  }

  // 5. REUNIÃO AGENDADA — enviar proposta pós-reunião
  if (stage === 'reuniao_agendada' && l.meeting_scheduled && !l.proposal_sent) {
    const text = `Obrigado pela reunião!

Conforme alinhado, segue a **proposta comercial** com:
- Tabela de preços (atacado)
- Condições: frete CIF + 21 dias
- 1º pedido bonificado (conforme combinado)
- Prazo de validade: 30 dias

Anexo a tabela. Qualquer dúvida, me chama no WhatsApp (11) 91357-7900.

${SIG}`;

    await send(l.email, 'Pindorama — proposta comercial (pós-reunião)', text);
    l.sdr_stage = 'proposta_enviada';
    l.proposal_sent = true;
    l.proposal_sent_date = today;
    l.sdr_last_activity = today;
    l.sdr_next_action = 'followup_proposta';
    l.sdr_next_action_date = (new Date(Date.now() + 3*86400000)).toISOString().split('T')[0];
    console.log('Proposta enviada:', l.name);
  }

  // 6. FOLLOW-UP PROPOSTA (3 dias)
  if (stage === 'proposta_enviada' && l.sdr_next_action === 'followup_proposta' && l.sdr_next_action_date <= today) {
    const text = `Olá! Tudo bem?

Conseguiu revisar a proposta da Pindorama?

Se tiver dúvidas sobre preços, condições ou quiser ajustar volumes, me avisa que a gente alinha.

Se não for o momento, sem problema.

${SIG}`;

    await send(l.email, 'Pindorama — follow-up proposta', text);
    l.sdr_last_activity = today;
    l.followup_count = (l.followup_count || 0) + 1;
    l.sdr_next_action_date = (new Date(Date.now() + 5*86400000)).toISOString().split('T')[0];
    console.log('Follow-up proposta:', l.name);
  }

  // 7. FOLLOW-UP GERAL PARA LEADS SEM RESPOSTA (7 dias sem atividade)
  if (stage !== 'fechado_ganho' && stage !== 'fechado_perdido' && l.sdr_last_activity) {
    const daysSince = Math.floor((new Date(today) - new Date(l.sdr_last_activity)) / 86400000);
    if (daysSince >= 7 && l.followup_count < 3) {
      const text = `Olá! Tudo bem?

Não tivemos retorno e queria saber se faz sentido mantermos o contato.

A Pindorama atende casas como Fasano, Hilton, Rosewood — e estamos com condição especial para novos parceiros: amostra grátis + 1º pedido bonificado.

Se não for o momento, me avisa que não volto a chamar.

${SIG}`;

    await send(l.email, 'Pindorama — última tentativa', text);
    l.sdr_last_activity = today;
    l.followup_count = (l.followup_count || 0) + 1;
    console.log('Follow-up geral (7 dias):', l.name);
  }
}

save(leads);
console.log('SDR daily concluído');