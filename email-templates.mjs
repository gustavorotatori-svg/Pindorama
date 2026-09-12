/**
 * 3 templates de email para teste A/B
 * 
 * Cada template é uma função que recebe dados do lead e retorna { subject, text, html }
 * 
 * VARIAVEIS DISPONIVEIS:
 *   lead.name       — Nome do estabelecimento
 *   lead.contact    — Nome do contato (se disponível)
 *   lead.context    — Contexto personalizado (ex: "vi que vocês trabalham com coquetéis")
 *   lead.neighborhood — Bairro
 *   lead.type       — Tipo (bar, restaurante, hotel, adega)
 */

const GIF_URL = 'https://iili.io/CkQ8gFR.gif';

const SIGNATURE_TEXT = `
---
Gustavo
Pindorama - Cachaça Artesanal
(11) 91357-7900
cachaca011pindorama@gmail.com`;

const SIGNATURE_HTML = (name) => `
<div style="margin-top: 25px; border-top: 1px solid #ddd; padding-top: 12px; font-family: Arial, sans-serif; font-size: 13px; color: #555;">
  <p style="margin: 0;"><strong>${name || 'Gustavo'}</strong></p>
  <p style="margin: 3px 0;">Pindorama — Cachaça Artesanal</p>
  <p style="margin: 3px 0;">(11) 91357-7900 · cachaca011pindorama@gmail.com</p>
  <div style="margin-top: 15px;">
    <img src="${GIF_URL}" alt="Pindorama" style="max-width: 280px; height: auto; border-radius: 6px;" />
  </div>
</div>`;

// ============================================
// TEMPLATE A — CONSULTIVO (recomendado como A)
// ============================================
// Posiciona como consultor. Pergunta sobre a carta de drinks.
// CTA de baixo compromisso: "posso sugerir combinações?"

export function templateConsultivo(lead) {
  const nome = lead.contact || lead.name;
  const barName = lead.name;
  const contextLine = lead.context || `vi que o ${barName} é um ótimo espaço`;

  const text = `Oi ${nome},

${contextLine} e tive uma ideia para a carta de drinks de vocês.

Trabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails. Acho que combinaria muito com o perfil do ${barName}.

Se quiser, posso sugerir algumas combinações que funcionam bem — sem compromisso.

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
cachaca011pindorama@gmail.com`;

  const html = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi ${nome},</p>
  <p>${contextLine} e tive uma ideia para a carta de drinks de vocês.</p>
  <p>Trabalho com cachaça artesanal (Pindorama) e o <strong>Fasano já usa em cocktails</strong>. Acho que combinaria muito com o perfil do ${barName}.</p>
  <p>Se quiser, posso sugerir algumas combinações que funcionam bem — sem compromisso.</p>
  ${SIGNATURE_HTML(lead.contact)}
</div>`;

  return {
    subject: `${barName} — ideia para carta de drinks`,
    text,
    html,
  };
}

// ============================================
// TEMPLATE B — PROVA SOCIAL
// ============================================
// Usa referências de clientes existentes.
// CTA: "posso enviar uma amostra?"

export function templateProvaSocial(lead) {
  const nome = lead.contact || lead.name;
  const barName = lead.name;

  const text = `Oi ${nome},

Trabalho com cachaça artesanal premium e o ${barName} me pareceu o perfil ideal.

Já fornecemos para hotéis e restaurantes como Fasano, Hilton, Rosewood — e estou expandindo para bares selecionados em SP.

Posso enviar uma amostra para vocês experimentarem?

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
cachaca011pindorama@gmail.com`;

  const html = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi ${nome},</p>
  <p>Trabalho com cachaça artesanal premium e o <strong>${barName}</strong> me pareceu o perfil ideal.</p>
  <p>Já fornecemos para hotéis e restaurantes como <strong>Fasano, Hilton, Rosewood</strong> — e estou expandindo para bares selecionados em SP.</p>
  <p>Posso enviar uma amostra para vocês experimentarem?</p>
  ${SIGNATURE_HTML(lead.contact)}
</div>`;

  return {
    subject: `Cachaça artesanal para o ${barName}`,
    text,
    html,
  };
}

// ============================================
// TEMPLATE C — PERGUNTA RÁPIDA (curiosity-driven)
// ============================================
// Curto, direto, gera curiosidade.
// CTA: responder sim/não.

export function templatePergunta(lead) {
  const nome = lead.contact || lead.name;
  const barName = lead.name;

  const text = `Oi ${nome},

Pergunta rápida: o ${barName} trabalha com cachaça artesanal na carta?

Se sim, tenho uma sugestão que acho que vai agradar. Se não, sem problemas.

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
cachaca011pindorama@gmail.com`;

  const html = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi ${nome},</p>
  <p>Pergunta rápida: o <strong>${barName}</strong> trabalha com cachaça artesanal na carta?</p>
  <p>Se sim, tenho uma sugestão que acho que vai agradar. Se não, sem problemas.</p>
  ${SIGNATURE_HTML(lead.contact)}
</div>`;

  return {
    subject: `Pergunta rápida — ${barName}`,
    text,
    html,
  };
}

// ============================================
// TEMPLATES DE FOLLOW-UP
// ============================================

function followupEmail2(lead) {
  const nome = lead.contact || lead.name;
  const barName = lead.name;

  const text = `Oi ${nome},

Enviei uma mensagem há alguns dias sobre cachaça artesanal para o ${barName}.

Se não chegou, posso reenviar. Se chegou e não faz sentido, sem problemas — só queria garantir.

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
cachaca011pindorama@gmail.com`;

  const html = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi ${nome},</p>
  <p>Enviei uma mensagem há alguns dias sobre cachaça artesanal para o <strong>${barName}</strong>.</p>
  <p>Se não chegou, posso reenviar. Se chegou e não faz sentido, sem problemas — só queria garantir.</p>
  ${SIGNATURE_HTML(lead.contact)}
</div>`;

  return {
    subject: `Re: ${barName} — cachaça artesanal`,
    text,
    html,
  };
}

function followupEmail3(lead) {
  const nome = lead.contact || lead.name;
  const barName = lead.name;

  const text = `Oi ${nome},

Último toque sobre o ${barName}.

Se tiver interesse em experimentar uma cachaça artesanal premium (já usada pelo Fasano e Hilton), é só me avisar.

Abraço,
Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
cachaca011pindorama@gmail.com`;

  const html = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi ${nome},</p>
  <p>Último toque sobre o <strong>${barName}</strong>.</p>
  <p>Se tiver interesse em experimentar uma cachaça artesanal premium (já usada pelo Fasano e Hilton), é só me avisar.</p>
  <p>Abraço,</p>
  ${SIGNATURE_HTML(lead.contact)}
</div>`;

  return {
    subject: `${barName} — última mensagem`,
    text,
    html,
  };
}

// ============================================
// MAPA DE TEMPLATES
// ============================================

export const TEMPLATES = {
  consultivo: templateConsultivo,
  prova_social: templateProvaSocial,
  pergunta: templatePergunta,
};

const FOLLOWUP_TEMPLATES = {
  email2: followupEmail2,
  email3: followupEmail3,
};

/**
 * Retorna template para o lead, com distribuição A/B automática
 * ou template específico se informado.
 */
export function getTemplate(lead, templateName) {
  // Follow-up usa template próprio
  if (lead.followupType && FOLLOWUP_TEMPLATES[lead.followupType]) {
    return FOLLOWUP_TEMPLATES[lead.followupType](lead);
  }

  if (templateName && TEMPLATES[templateName]) {
    return TEMPLATES[templateName](lead);
  }

  // Distribuição A/B automática baseada no índice do lead
  const templates = ['consultivo', 'prova_social', 'pergunta'];
  const idx = lead._index || 0;
  const selected = templates[idx % 3];

  return TEMPLATES[selected](lead);
}
