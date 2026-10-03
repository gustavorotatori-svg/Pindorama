import { readFileSync } from 'fs';

const LEADS_FILE = 'leads-qualificados.json';

function load() { return JSON.parse(readFileSync('leads-qualificados.json', 'utf8')); }

const leads = load().filter(l => !l.fora_foco);

console.log('=== PIPELINE SDR PINDORAMA ===');
console.log('Data:', new Date().toISOString().split('T')[0]);
console.log('');

const total = leads.length;
const byStage = {};
const byCity = {};
let totalValue = 0;
let proposals = 0;
let meetings = 0;
let samplesSent = 0;
let samplesReq = 0;

for (const l of leads) {
  const stage = l.sdr_stage || 'novo';
  byStage[stage] = (byStage[stage] || 0) + 1;
  byCity[l.city] = (byCity[l.city] || 0) + 1;
  
  if (l.proposal_sent) { proposals++; totalValue += (l.proposal_value || 0); }
  if (l.meeting_scheduled) meetings++;
  if (l.sample_sent) samplesSent++;
  if (l.sample_requested) samplesReq++;
}

console.log('=== TOTAL LEADS (RMSP+ABCD):', Object.keys(leads).length || leads.length);
console.log('');
console.log('=== POR STAGE ===');
for (const [k,v] of Object.entries(byStage).sort((a,b)=>b[1]-a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log('');
console.log('=== MÉTRICAS ===');
console.log(`  Reuniões agendadas: ${meetings}`);
console.log(`  Amostras solicitadas: ${samplesReq}`);
console.log(`  Amostras enviadas: ${samplesSent}`);
console.log(`  Propostas enviadas: ${proposals}`);
console.log(`  Valor pipeline (propostas): R$ ${(totalValue/100).toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
console.log('');
console.log('=== TOP CIDADES ===');
for (const [k,v] of Object.entries(byCity).sort((a,b)=>b[1]-a[1]).slice(0,10)) {
  console.log(`  ${k}: ${v}`);
}
console.log('');

const today = new Date().toISOString().split('T')[0];
const overdue = leads.filter(l => l.sdr_next_action_date && l.sdr_next_action_date < new Date().toISOString().split('T')[0] && l.sdr_stage !== 'fechado_ganho' && l.sdr_stage !== 'fechado_perdido');
console.log(`\n=== AÇÕES ATRASADAS (${overdue.length}) ===`);
for (const l of overdue.slice(0,10)) {
  console.log(`  ${l.name} | ${l.sdr_stage} | próxima: ${l.sdr_next_action} (${l.sdr_next_action_date})`);
}