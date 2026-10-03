import { readFileSync, writeFileSync } from 'fs';

const LEADS_FILE = 'leads-qualificados.json';

function load() { return JSON.parse(readFileSync('leads-qualificados.json', 'utf8')); }
function save(d) { writeFileSync('leads-qualificados.json', JSON.stringify(d, null, 2)); }
function todayISO() { return new Date().toISOString().split('T')[0]; }

const leads = load();
const today = todayISO();

/**
 * Processa resposta de lead via webhook Gmail
 * @param {string} fromEmail - email do remetente
 * @param {string} subject - assunto
 * @param {string} body - corpo do email
 * @param {string} messageId - Message-ID do Gmail
 */
function processReply(fromEmail, subject, body, messageId) {
  const email = fromEmail.toLowerCase().trim();
  
  const lead = leads.find(l => 
    l.email && l.email.toLowerCase() === email && 
    (l.sdr_stage === 'amostra_oferecida' || l.sdr_stage === 'aguarda_resposta_amostra')
  );
  
  if (!lead) {
    console.log('Lead não encontrado para:', email);
    return { success: false, reason: 'lead_not_found' };
  }
  
  const text = (subject + ' ' + body).toLowerCase();
  
  // Palavras-chave de interesse
  const interestKeywords = ['sim', 'interesse', 'quero', 'gostaria', 'amostra', 'bonificado', 'proposta', 'reunião', 'agendar', 'marcar'];
  const negativeKeywords = ['não', 'nao', 'obrigado', 'desculpe', 'sem interesse', 'não tenho', 'nao tenho', 'cancelar'];
  
  const hasInterest = interestKeywords.some(k => text.includes(k));
  const hasNegative = negativeKeywords.some(k => text.includes(k));
  
  if (hasNegative && !hasInterest) {
    // Lead não tem interesse
    leads.find(l => l.email.toLowerCase() === email).sdr_stage = 'fechado_perdido';
    leads.find(l => l.email.toLowerCase() === email).sdr_last_activity = today;
    leads.find(l => l.email.toLowerCase() === email).notes = 'Resposta negativa: ' + subject;
    save(leads);
    console.log('Lead marcado como perdido:', leads.find(l => l.email.toLowerCase() === email).name);
    return { success: true, action: 'closed_lost' };
  }
  
  if (hasInterest) {
    // Lead tem interesse - solicita amostra
    const leadObj = leads.find(l => l.email.toLowerCase() === email);
    leadObj.sdr_stage = 'amostra_solicitada';
    leadObj.sample_requested = true;
    leadObj.sample_requested_date = today;
    leadObj.sdr_stage = 'amostra_solicitada';
    leadObj.sdr_last_activity = today;
    leadObj.sdr_next_action = 'aguarda_logistica_amostra';
    leadObj.last_reply_date = today;
    leadObj.last_reply_subject = subject;
    leadObj.notes = 'Resposta positiva: ' + subject;
    save(leads);
    console.log('Amostra solicitada:', leads.find(l => l.email.toLowerCase() === email).name);
    return { success: true, action: 'sample_requested' };
  }
  
  // Resposta neutra - mantém aguardando
  return { success: true, action: 'neutral' };
}

// Se chamado diretamente (para teste)
if (import.meta.url === `file://${process.argv[1]}`) {
  const fromEmail = process.argv[2];
  const subject = process.argv[3];
  const body = process.argv[4];
  const messageId = process.argv[5];
  
  if (!fromEmail || !subject || !body) {
    console.error('Uso: node sdr_webhook.mjs "from@email.com" "Assunto" "Corpo" "message-id"');
    process.exit(1);
  }
  
  const result = processReply(fromEmail, subject, body, messageId);
  console.log('Resultado:', JSON.stringify(result, null, 2));
}

export { processReply };