import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const LEADS_FILE = 'leads-qualificados.json';
const SIG = '\n\nAbra\u00e7o,\nGustavo\nPindorama - Cacha\u00e7a Artesanal\n(11) 91357-7900';

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });

function load() { return JSON.parse(readFileSync('leads-qualificados.json', 'utf8')); }
function save(d) { writeFileSync('leads-qualificados.json', JSON.stringify(d, null, 2)); }
function todayISO() { return new Date().toISOString().split('T')[0]; }

async function send(to, subject, text) {
  await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
  console.log('EMAIL OK:', to);
}

const leads = load();
const today = todayISO();

for (const l of leads) {
  if (!l.emailVerified || !l.emailSource) continue;
  if (l.fora_foco) continue;

  const stage = l.sdr_stage || 'novo';

  // 1. FOLLOW-UP AMOSTRA (2 dias apos email1)
  if (stage === 'contatado' && l.sdr_next_action === 'followup_amostra' && l.sdr_next_action_date <= today) {
    const text = `Ol\u00e1! Tudo bem?

Sou o Gustavo, da Pindorama - cacha\u00e7a artesanal premium do Vale do Caf\u00e9 (RJ), a mesma que atende Fasano, Hilton e Rosewood.

Vi que voc\u00ea recebeu nossa apresenta\u00e7\u00e3o e queria saber: tem interesse em receber uma **amostra gr\u00e1tis** para avaliar a qualidade? O primeiro pedido sai **bonificado** (frete CIF + 21 dias para pagar).

Se tiver interesse, me passa:
- Endere\u00e7o completo de entrega
- CNPJ
- WhatsApp do respons\u00e1vel pelo recebimento

Se n\u00e3o for o momento, sem problema - n\u00e3o volto a chamar.

${SIG}`;

    await send(l.email, 'Pindorama - amostra gr\u00e1tis + 1\u00ba pedido bonificado', text);

    l.sdr_stage = 'amostra_oferecida';
    l.sdr_last_activity = today;
    l.sdr_next_action = 'aguarda_resposta_amostra';
    l.sdr_next_action_date = null;
    l.followup_count = (l.followup_count || 0) + 1;
    console.log('Follow-up amostra enviado:', l.name);
  }

  // 2. AGUARDA RESPOSTA AMOSTRA - se nao respondeu em 5 dias, 2o follow-up
  if (stage === 'amostra_oferecida' && l.last_reply_date === null) {
    const daysSince = l.sdr_last_activity ? Math.floor((new Date(today) - new Date(l.sdr_last_activity)) / 86400000) : 0;
    if (daysSince >= 5) {
      const text = `Ol\u00e1! Tudo bem?

Seguindo: tem interesse na **amostra gr\u00e1tis** da Pindorama para testar no seu estabelecimento?

Lembrete: o primeiro pedido sai **bonificado** (frete CIF + 21 dias para pagar).

Se n\u00e3o for o momento, me avisa que n\u00e3o volto a chamar.

${SIG}`;

    await send(l.email, 'Pindorama - amostra gr\u00e1tis (segue)', text);
    l.sdr_last_activity = today;
    l.followup_count = (l.followup_count || 0) + 1;
    console.log('2\u00ba follow-up amostra:', l.name);
  }

  // 3. AMOSTRA SOLICITADA - confirmar envio e pedir logistica
  if (stage === 'amostra_solicitada' && l.sample_requested && !l.sample_sent) {
    const text = `Perfeito! Vamos enviar a amostra.

Para o envio, preciso confirmar:
- Endere\u00e7o completo de entrega
- Nome do respons\u00e1vel pelo recebimento
- WhatsApp de contato
- CNPJ (para nota fiscal)

A amostra sai **gr\u00e1tis** + 1\u00ba pedido bonificado (frete CIF, 21 dias).

${SIG}`;

    await send(l.email, 'Pindorama - confirma\u00e7\u00e3o de envio da amostra', text);
    l.sdr_stage = 'aguarda_logistica_amostra';
    l.sdr_last_activity = today;
    l.sdr_next_action = 'aguarda_logistica_amostra';
    console.log('Confirma\u00e7\u00e3o log\u00edstica amostra:', l.name);
  }

  // 4. AMOSTRA ENVIADA - follow-up pos-entrega (3 dias)
  if (stage === 'amostra_enviada' && l.sample_sent && !l.sample_feedback) {
    const daysSince = l.sample_sent_date ? Math.floor((new Date(today) - new Date(l.sample_sent_date)) / 86400000) : 0;
    if (daysSince >= 3) {
      const text = `Ol\u00e1! A amostra da Pindorama chegou?

Gostaria de saber sua impress\u00e3o: o que achou da qualidade, aroma, sabor?

Se quiser, podemos agendar uma call r\u00e1pida (15 min) para alinhar o primeiro pedido bonificado.

${SIG}`;

    await send(l.email, 'Pindorama - feedback da amostra', text);
    l.sdr_stage = 'aguarda_feedback_amostra';
    l.sdr_last_activity = today;
    l.followup_count = (l.followup_count || 0) + 1;
    console.log('Follow-up feedback amostra:', l.name);
  }

  // 5. REUNIAO AGENDADA - enviar proposta pos-reuniao
  if (stage === 'reuniao_agendada' && l.meeting_scheduled && !l.proposal_sent) {
    const text = `Obrigado pela reuni\u00e3o!

Conforme alinhado, segue a **proposta comercial** com:
- Tabela de pre\u00e7os (atacado)
- Condi\u00e7\u00f5es: frete CIF + 21 dias
- 1\u00ba pedido bonificado (conforme combinado)
- Prazo de validade: 30 dias

Anexo a tabela. Qualquer d\u00favida, me chama no WhatsApp (11) 91357-7900.

${SIG}`;

    await send(l.email, 'Pindorama - proposta comercial (p\u00f3s-reuni\u00e3o)', text);
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
    const text = `Ol\u00e1! Tudo bem?

Conseguiu revisar a proposta da Pindorama?

Se tiver d\u00favidas sobre pre\u00e7os, condi\u00e7\u00f5es ou quiser ajustar volumes, me avisa que a gente alinha.

Se n\u00e3o for o momento, sem problema.

${SIG}`;

    await send(l.email, 'Pindorama - follow-up proposta', text);
    l.sdr_last_activity = today;
    l.followup_count = (l.followup_count || 0) + 1;
    l.sdr_next_action_date = (new Date(Date.now() + 5*86400000)).toISOString().split('T')[0];
    console.log('Follow-up proposta:', l.name);
  }

  // 7. FOLLOW-UP GERAL PARA LEADS SEM RESPOSTA (7 dias sem atividade)
  if (stage !== 'fechado_ganho' && stage !== 'fechado_perdido' && l.sdr_last_activity) {
    const daysSince = Math.floor((new Date(today) - new Date(l.sdr_last_activity)) / 86400000);
    if (daysSince >= 7 && l.followup_count < 3) {
      const text = `Ol\u00e1! Tudo bem?

N\u00e3o tivemos retorno e queria saber se faz sentido mantermos o contato.

A Pindorama atende casas como Fasano, Hilton, Rosewood - e estamos com condi\u00e7\u00e3o especial para novos parceiros: amostra gr\u00e1tis + 1\u00ba pedido bonificado.

Se n\u00e3o for o momento, me avisa que n\u00e3o volto a chamar.

${SIG}`;

    await send(l.email, 'Pindorama - \u00faltima tentativa', text);
    l.sdr_last_activity = today;
    l.followup_count = (l.followup_count || 0) + 1;
    console.log('Follow-up geral (7 dias):', l.name);
  }
}

save(leads);
console.log('SDR daily conclu\u00eddo');
