/**
 * DASHBOARD DE MÉTRICAS — Prospecção Pindorama
 * 
 * Uso: node metrics.mjs
 */

import { readFileSync, existsSync } from 'fs';

function loadLeads(file) {
  if (!existsSync(file)) return [];
  try { return JSON.parse(readFileSync(file, 'utf-8')); }
  catch { return []; }
}

function analyze() {
  const oldLeads = loadLeads('leads.json');
  const qualifiedLeads = loadLeads('leads-qualificados.json');
  const allLeads = [...oldLeads, ...qualifiedLeads];

  console.log(`
╔══════════════════════════════════════════════════════════╗
║         📊 DASHBOARD DE PROSPECÇÃO — PINDORAMA          ║
╚══════════════════════════════════════════════════════════╝
  `);

  // === BÁSICO ===
  const sentEmail1 = allLeads.filter(l => l.email1);
  const sentEmail2 = allLeads.filter(l => l.email2);
  const sentEmail3 = allLeads.filter(l => l.email3);
  const withContact = allLeads.filter(l => l.contact || l.contactEmail);
  const withResponse = allLeads.filter(l => l.response);
  const withDate = allLeads.filter(l => l.date1);

  console.log('📬 VOLUME DE ENVIOS');
  console.log(`  Total leads cadastrados:  ${allLeads.length}`);
  console.log(`  Email1 enviados:          ${sentEmail1.length}`);
  console.log(`  Email2 enviados:          ${sentEmail2.length}`);
  console.log(`  Email3 enviados:          ${sentEmail3.length}`);
  console.log(`  Total envios:             ${sentEmail1.length + sentEmail2.length + sentEmail3.length}`);

  // === QUALIDADE ===
  const validatedEmails = qualifiedLeads.filter(l => l.email1);
  
  console.log(`\n✅ QUALIDADE DA LISTA`);
  console.log(`  Leads com email verificado: ${validatedEmails.length}`);
  console.log(`  Leads com contato real:     ${withContact.length}`);
  console.log(`  Leads no sistema antigo:    ${oldLeads.length}`);
  console.log(`  Leads no sistema novo:      ${qualifiedLeads.length}`);

  // === RESPOSTAS ===
  console.log(`\n💬 RESPOSTAS`);
  console.log(`  Total respostas recebidas:  ${withResponse.length}`);

  if (withResponse.length > 0) {
    for (const l of withResponse) {
      console.log(`  ✅ ${l.name} → ${l.response}`);
    }
  } else {
    console.log(`  ⏳ Nenhuma resposta ainda`);
  }

  const respostaRate = sentEmail1.length > 0 
    ? ((withResponse.length / sentEmail1.length) * 100).toFixed(1) 
    : '0.0';
  console.log(`  Taxa de resposta:           ${respostaRate}%`);

  // === TEMPLATES ===
  console.log(`\n🎨 DISTRIBUIÇÃO A/B`);
  const leadTypes = {};
  qualifiedLeads.forEach(l => {
    const t = l.template || 'auto';
    leadTypes[t] = (leadTypes[t] || 0) + 1;
  });
  for (const [t, count] of Object.entries(leadTypes)) {
    console.log(`  ${t}: ${count} leads`);
  }

  // === STATUS OPERACIONAL (pendentes / limite / planilha / whatsapp) ===
  console.log(`\n⚙️  STATUS OPERACIONAL`);
  const pending = qualifiedLeads.filter(l => l.email && !l.email1);
  const pendingNoEmail = qualifiedLeads.filter(l => !l.email);
  console.log(`  Pendentes p/ email1:       ${pending.length}`);
  if (pendingNoEmail.length) console.log(`  Sem email cadastrado:      ${pendingNoEmail.length}`);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');
  let sentToday = 0;
  allLeads.forEach(l => {
    if (l.email1 && l.date1 === todayStr) sentToday++;
    if (l.email2 && l.date2 === todayStr) sentToday++;
    if (l.email3 && l.date3 === todayStr) sentToday++;
  });
  const GMAIL_DAILY_LIMIT = 500;
  console.log(`  Enviados hoje (registrados): ${sentToday}`);
  console.log(`  Limite global de email:      490 por janela móvel de 24h`);

  if (existsSync('leads-planilha.json')) {
    const plan = JSON.parse(readFileSync('leads-planilha.json', 'utf-8'));
    const processed = plan.filter(l => l.processed).length;
    console.log(`  Planilha:                  ${processed}/${plan.length} processados (${plan.length - processed} restantes)`);
  }

  const waToday = qualifiedLeads.filter(l => l.whatsappSent && l.whatsappDate === todayStr).length;
  const waTotal = qualifiedLeads.filter(l => l.whatsappSent).length;
  console.log(`  WhatsApp hoje:             ${waToday}/4 (máx diário)`);
  console.log(`  WhatsApp total:            ${waTotal}`);

  // === SEGMENTOS ===
  console.log(`\n🏷️  SEGMENTOS`);
  const segments = {};
  qualifiedLeads.forEach(l => {
    const type = l.type || 'outro';
    segments[type] = segments[type] || { total: 0, sent: 0 };
    segments[type].total++;
    if (l.email1) segments[type].sent++;
  });
  for (const [type, data] of Object.entries(segments)) {
    console.log(`  ${type}: ${data.sent}/${data.total} enviados`);
  }

  // === BAIRROS ===
  console.log(`\n📍 BAIRROS`);
  const bairros = {};
  allLeads.forEach(l => {
    const b = l.neighborhood || 'N/I';
    bairros[b] = (bairros[b] || 0) + 1;
  });
  for (const [b, count] of Object.entries(bairros).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${b}: ${count}`);
  }

  // === TIMELINE DOS ÚLTIMOS DIAS ===
  console.log(`\n📅 TIMELINE`);
  const days = {};
  allLeads.filter(l => l.date1).forEach(l => {
    const d = l.date1;
    days[d] = days[d] || { email1: 0, email2: 0, response: 0 };
    days[d].email1++;
  });
  allLeads.filter(l => l.date2).forEach(l => {
    if (days[l.date2]) days[l.date2].email2++;
    else days[l.date2] = { email1: 0, email2: 1, response: 0 };
  });
  // Add responses on date
  withResponse.forEach(l => {
    const d = l.date2 || l.date1;
    if (d) {
      if (days[d]) days[d].response = (days[d].response || 0) + 1;
      else days[d] = { email1: 0, email2: 0, response: 1 };
    }
  });
  for (const [d, data] of Object.entries(days).sort()) {
    console.log(`  ${d}: ${data.email1} envios, ${data.email2} follow-ups${data.response ? `, ${data.response} respostas` : ''}`);
  }

  console.log(`\n══════════════════════════════════════════════════════\n`);
}

analyze();
