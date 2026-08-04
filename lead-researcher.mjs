/**
 * LEAD RESEARCHER — Encontra emails REAIS de estabelecimentos
 * 
 * Uso:
 *   node lead-researcher.mjs                       — pesquisa leads de leads-pendentes.json
 *   node lead-researcher.mjs --name "Bar X" --neighborhood "Moema"  — pesquisa 1 lead
 *   node lead-researcher.mjs --verify               — apenas valida emails existentes
 */

import dns from 'dns/promises';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const LEADS_FILE = 'leads-qualificados.json';

// === BUSCA DE EMAIL NO SITE ===
async function findEmailOnWebsite(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PindoramaResearch/1.0)' }
    });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    
    const html = await res.text();
    
    // Padrões de email comuns
    const emailPatterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    ];
    
    const emails = new Set();
    for (const pattern of emailPatterns) {
      const matches = html.match(pattern) || [];
      for (const m of matches) {
        const email = m.replace('mailto:', '').toLowerCase().trim();
        // Filtrar emails genéricos de suporte
        if (!email.includes('sentry') && !email.includes('example') && 
            !email.includes('test') && !email.includes('noreply') &&
            !email.includes('no-reply') && !email.includes('wixpress') &&
            !email.includes('schema.org')) {
          emails.add(email);
        }
      }
    }
    
    return [...emails];
  } catch {
    return null;
  }
}

// === VALIDAÇÃO DNS ===
async function validateEmail(email) {
  const domain = email.split('@')[1];
  try {
    const mx = await dns.resolveMx(domain);
    return mx && mx.length > 0;
  } catch {
    return false;
  }
}

// === QUALIFICAÇÃO DO LEAD ===
function qualifyLead(lead) {
  let score = 0;
  const notes = [];

  // Email válido
  if (lead.emails && lead.emails.length > 0) {
    score += 30;
    notes.push('Email encontrado no site');
  }

  // Website existe
  if (lead.website) {
    score += 10;
    notes.push('Website ativo');
  }

  // Google Maps rating
  if (lead.rating >= 4.5) { score += 25; notes.push(`Rating ${lead.rating}`); }
  else if (lead.rating >= 4.0) { score += 20; notes.push(`Rating ${lead.rating}`); }
  else if (lead.rating >= 3.5) { score += 10; notes.push(`Rating ${lead.rating}`); }

  // Reviews
  if (lead.reviews >= 100) { score += 20; notes.push(`${lead.reviews} reviews`); }
  else if (lead.reviews >= 50) { score += 15; notes.push(`${lead.reviews} reviews`); }
  else if (lead.reviews >= 20) { score += 10; notes.push(`${lead.reviews} reviews`); }

  // Tipo de estabelecimento
  const premiumTypes = ['hotel', 'restaurante', 'bar', 'adega', 'cocktail'];
  if (premiumTypes.some(t => (lead.type || '').toLowerCase().includes(t))) {
    score += 15;
    notes.push(`Tipo: ${lead.type}`);
  }

  // Localização premium
  const premiumAreas = ['jardins', 'moema', 'itaim', 'pinheiros', 'vila olímpia', 'higienópolis'];
  if (premiumAreas.some(a => (lead.neighborhood || '').toLowerCase().includes(a))) {
    score += 10;
    notes.push(`Localização: ${lead.neighborhood}`);
  }

  lead.score = score;
  lead.qualification = notes.join(' | ');
  
  return lead;
}

// === PIPELINE PRINCIPAL ===
async function researchLead(leadData) {
  console.log(`\n🔍 Pesquisando: ${leadData.name}`);
  
  const lead = {
    name: leadData.name,
    neighborhood: leadData.neighborhood || '',
    type: leadData.type || '',
    website: null,
    emails: [],
    emailPrimary: null,
    score: 0,
    qualification: '',
    researchedAt: new Date().toISOString(),
  };

  // Buscar website (se não fornecido)
  if (leadData.website) {
    lead.website = leadData.website;
  }

  // Se tem website, buscar emails
  if (lead.website) {
    console.log(`   Buscando emails em ${lead.website}...`);
    const emails = await findEmailOnWebsite(lead.website);
    if (emails && emails.length > 0) {
      lead.emails = emails;
      console.log(`   ✅ Encontrados: ${emails.join(', ')}`);
    } else {
      console.log(`   ⚠️ Nenhum email encontrado no site`);
    }
  }

  // Validar emails por DNS
  if (lead.emails.length > 0) {
    const validEmails = [];
    for (const email of lead.emails) {
      const isValid = await validateEmail(email);
      if (isValid) {
        validEmails.push(email);
        console.log(`   ✅ ${email} — válido`);
      } else {
        console.log(`   ❌ ${email} — inválido`);
      }
    }
    lead.emails = validEmails;
    lead.emailPrimary = validEmails[0] || null;
  }

  // Qualificar
  qualifyLead(lead);
  console.log(`   📊 Score: ${lead.score} | ${lead.qualification}`);

  return lead;
}

// === MODO INTERATIVO: Pesquisar 1 lead ===
async function researchByName(name, neighborhood) {
  const lead = { name, neighborhood };
  const result = await researchLead(lead);
  
  // Salvar
  let leads = [];
  if (existsSync(LEADS_FILE)) {
    leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
  }
  
  // Evitar duplicatas
  const existing = leads.findIndex(l => l.name === name && l.neighborhood === neighborhood);
  if (existing >= 0) {
    leads[existing] = result;
  } else {
    leads.push(result);
  }
  
  writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  console.log(`\n💾 Salvo em ${LEADS_FILE}`);
  
  return result;
}

// === MODO BATCH: Pesquisar de arquivo ===
async function researchBatch(filePath) {
  const pending = JSON.parse(readFileSync(filePath, 'utf-8'));
  console.log(`\n📋 Pesquisando ${pending.length} leads...\n`);
  
  let leads = [];
  if (existsSync(LEADS_FILE)) {
    leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
  }
  
  for (const item of pending) {
    const result = await researchLead(item);
    
    const existing = leads.findIndex(l => l.name === item.name);
    if (existing >= 0) {
      leads[existing] = result;
    } else {
      leads.push(result);
    }
    
    // Delay entre pesquisas
    await new Promise(r => setTimeout(r, 1000));
  }
  
  writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  
  // Resumo
  const withEmail = leads.filter(l => l.emailPrimary);
  console.log(`\n=== RESUMO ===`);
  console.log(`Total pesquisados: ${leads.length}`);
  console.log(`Com email válido: ${withEmail.length}`);
  console.log(`Score médio: ${(leads.reduce((a, l) => a + l.score, 0) / leads.length).toFixed(0)}`);
}

// === MODO: Apenas validar emails existentes ===
async function verifyExisting() {
  if (!existsSync(LEADS_FILE)) {
    console.log('Nenhum arquivo de leads encontrado.');
    return;
  }
  
  const leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
  console.log(`\n🔍 Validando ${leads.length} leads existentes...\n`);
  
  for (const lead of leads) {
    if (lead.emailPrimary) {
      const isValid = await validateEmail(lead.emailPrimary);
      console.log(`${isValid ? '✅' : '❌'} ${lead.emailPrimary} (${lead.name})`);
      lead.emailValid = isValid;
    }
  }
  
  writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

// === CLI ===
const args = process.argv.slice(2);

if (args.includes('--name') && args.includes('--neighborhood')) {
  const name = args[args.indexOf('--name') + 1];
  const neighborhood = args[args.indexOf('--neighborhood') + 1];
  researchByName(name, neighborhood);
} else if (args.includes('--verify')) {
  verifyExisting();
} else if (args.includes('--batch')) {
  const file = args[args.indexOf('--batch') + 1];
  researchBatch(file);
} else {
  console.log('Uso:');
  console.log('  node lead-researcher.mjs --name "Bar X" --neighborhood "Moema"');
  console.log('  node lead-researcher.mjs --verify');
  console.log('  node lead-researcher.mjs --batch leads-pendentes.json');
}
