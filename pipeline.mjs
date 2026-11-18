import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import dns from 'dns';
import { emailQuotaAvailable, recordEmailOutput } from './email-quota.mjs';

try { dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']); } catch {}

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;

if (!MAIL_USER || !MAIL_PASS) {
  throw new Error('GMAIL_USER e GMAIL_APP_PASSWORD sao obrigatorios');
}
const LEADS_FILE = 'leads-qualificados.json';
const OLD_FILE = 'leads.json';
const SUPPRESSED_EMAILS_FILE = 'suppressed-emails.json';
const GIF_TAG = '<br><br><img src="https://iili.io/CkQ8gFR.gif" style="display:block;margin-top:12px;max-width:400px" />';
const DELAY_MS = 800;
const SIGNATURE = '\n\nAbra\u00e7o,\nGustavo\nPindorama \u2014 Cacha\u00e7a Artesanal\n(11) 91357-7900';

const transporter = nodemailer.createTransport({service:'gmail',auth:{user:MAIL_USER,pass:MAIL_PASS}});

function load(file) { return JSON.parse(readFileSync(file, 'utf-8')); }
function save(file, data) { writeFileSync(file, JSON.stringify(data, null, 2)); }
const SUPPRESSED_EMAILS = new Set(load(SUPPRESSED_EMAILS_FILE).map(email => String(email).toLowerCase()));

function today() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; }
function daysAgo(dateStr, days) { const d = new Date(dateStr); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]; }

function validateDNS(email, attempt = 1) {
  return new Promise(resolve => {
    const domain = email.split('@')[1];
    if (!domain) return resolve(false);
    dns.resolveMx(domain, (err, mx) => {
      if (!err && mx && mx.length > 0) return resolve(true);
      if (attempt < 3) {
        const delayMs = attempt * 1000;
        setTimeout(() => resolve(validateDNS(email, attempt + 1)), delayMs);
        return;
      }
      resolve(false);
    });
  });
}

// ICP (18/11/2026): somente coquetelaria premium — bares de drinks, restaurantes
// premium, hotéis, casas noturnas, clubes e gastrobar. Verticais industrial,
// cervejaria, panificação e revenda foram descontinuadas (zero retorno).
const COCKTAIL_TYPES = new Set([
  'bar', 'bar_coquetel', 'bar_coquetelaria', 'coquetelaria', 'gastrobar',
  'bistro', 'bistrô', 'balada', 'restaurante', 'restaurante_premium',
  'hotel', 'clube', 'lounge', 'pub', 'wine_bar', 'steakhouse',
  'churrascaria', 'cafeteria'
]);
const COCKTAIL_TYPE_RE = /(^|_)(bar|coquetel|coquetelaria|gastrobar|bistro|bistrô|balada|restaurante|hotel|clube|lounge|pub|wine_bar|steakhouse|churrascaria|cafeteria|sushi|japonesa)(_|$)/;
function isCocktailICP(lead) {
  const t = String(lead?.type || '').toLowerCase().trim();
  return !!t && (COCKTAIL_TYPES.has(t) || COCKTAIL_TYPE_RE.test(t));
}

const TYPE_PRIORITY = {
  coquetelaria: 100, bar_coquetel: 98, bar: 95, gastrobar: 92, wine_bar: 90,
  balada: 85, bistro: 82, 'bistrô': 82, lounge: 80, restaurante_premium: 78,
  restaurante: 75, hotel: 65, clube: 60, pub: 55, steakhouse: 50,
  sushi: 48, churrascaria: 45, cafeteria: 40
};
const FREE_EMAIL_DOMAINS = new Set(['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'uol.com.br', 'terra.com.br', 'bol.com.br', 'ig.com.br']);
const BLOCKED_RECIPIENT_DOMAINS = new Set(['mocoto.com.br']);

function emailDomain(email) {
  return String(email || '').split('@')[1]?.toLowerCase() || '';
}

function leadPriority(lead) {
  const domain = String(lead.email || '').split('@')[1]?.toLowerCase() || '';
  let score = TYPE_PRIORITY[lead.type] || 0;
  if (lead.website) score += 12;
  if (lead.context && String(lead.context).trim().length >= 20) score += 10;
  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) score += 8;
  if (lead.phone || lead.whatsapp) score += 4;
  return score;
}

function eligibleFirstContactType(type) {
  return isCocktailICP({ type });
}

function daysFromNow(dateStr) {
  const d = new Date(dateStr);
  const n = new Date();
  return Math.floor((n - d) / (1000 * 60 * 60 * 24));
}

function verifiedFirstContact(lead) {
  if (SUPPRESSED_EMAILS.has(String(lead.email || '').toLowerCase())) return false;
  if (BLOCKED_RECIPIENT_DOMAINS.has(emailDomain(lead.email))) return false;
  if (!eligibleFirstContactType(lead.type)) return false;
  if (lead.emailVerified !== true) return false;
  const source = String(lead.emailSource || '').trim();
  const verifiedAt = String(lead.emailVerifiedAt || '').trim();
  const trustedSource = /^https?:\/\//i.test(source) || /cnpja|econodata|prospec/i.test(source);
  if (!trustedSource || !/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) return false;
  const ageDays = daysDiff(verifiedAt);
  return ageDays >= 0 && ageDays <= 90;
}

function emailFrozen(lead) {
  if (lead.emailFrozenUntil) {
    const dias = daysFromNow(lead.emailFrozenUntil);
    if (dias > 0) return true;
  }
  return false;
}

// Follow-ups: so para leads que NAO responderam e estao no ICP coquetelaria.
const RESPONDED_STATUSES = new Set([
  'interested', 'responded', 'responded_routed', 'replied', 'qualified',
  'cliente', 'closed', 'won', 'meeting', 'meeting_scheduled', 'proposta'
]);
function hasResponded(lead) {
  if (lead.response || lead.responded || lead.interested || lead.replied) return true;
  return RESPONDED_STATUSES.has(String(lead.status || '').toLowerCase());
}

// Toque 2: 3 a 30 dias apos email1. Toque 3: 4 a 30 dias apos email2.
const FOLLOWUP_MIN_DAYS_2 = 3;
const FOLLOWUP_MIN_DAYS_3 = 4;
const FOLLOWUP_MAX_DAYS = 30;
function followupStepDue(lead) {
  if (!lead.email1 || hasResponded(lead)) return null;
  if (!lead.email2 && lead.date1) {
    const d = daysDiff(lead.date1);
    if (d >= FOLLOWUP_MIN_DAYS_2 && d <= FOLLOWUP_MAX_DAYS) return 'email2';
  }
  if (lead.email2 && !lead.email3 && lead.date2) {
    const d = daysDiff(lead.date2);
    if (d >= FOLLOWUP_MIN_DAYS_3 && d <= FOLLOWUP_MAX_DAYS) return 'email3';
  }
  return null;
}

function permanentRecipientError(error) {
  const text = `${error?.responseCode || ''} ${error?.code || ''} ${error?.response || ''} ${error?.message || ''}`.toLowerCase();
  if (/5\.4\.5|sending limit|rate.?limit|too many|quota exceeded|try again later|4\.7\.28|421/.test(text)) return false;
  return /\b550\b|5\.1\.1|user unknown|no such user|mailbox unavailable|recipient address rejected|address not found/.test(text);
}

function suppressInvalidEmail(email, reason) {
  const leads = load(LEADS_FILE);
  const idx = leads.findIndex(x => String(x.email || '').toLowerCase() === String(email || '').toLowerCase());
  if (idx === -1) return;
  leads[idx].invalidEmail = true;
  leads[idx].invalidEmailReason = reason;
  leads[idx].invalidEmailDate = today();
  save(LEADS_FILE, leads);
}

const TEMPLATES = {
  email1_consultivo: `Olá {nome},

Vi que {contexto}.

Sou o Gustavo, da Pindorama (cachaça artesanal do Vale do Café/RJ). Temos rótulos como Clássica, Ouro e Cobra Coral (jabuticaba) que funcionam bem em caipirinhas e drinks autorais.

Faz sentido eu te enviar 2 sugestões de drinks pensadas para a casa + condições? Se quiser, posso separar uma amostra para teste.

Se não for o momento, é só responder "não" que encerro por aqui.`,
  email1_prova_social: `Olá {nome},

Vi que {contexto}.

Sou o Gustavo, da Pindorama — cachaça artesanal do Vale do Café (RJ), presente em casas como Fasano, Hilton e Rosewood. A Clássica, a Ouro e a Cobra Coral (jabuticaba) têm ido bem em cartas de coquetelaria.

Posso te mandar uma sugestão de aplicação no bar e as condições para a {nome}? Também consigo levar amostra.

Se não fizer sentido, responda "não" que não insisto.`,
  email1_pergunta: `Olá {nome},

Pergunta rápida: a {nome} já trabalha com alguma cachaça artesanal premium na carta de drinks?

Vi que {contexto}. Sou o Gustavo, da Pindorama (Vale do Café/RJ) — Clássica, Ouro e Cobra Coral (jabuticaba) costumam funcionar bem em caipirinhas e coquetéis autorais.

Se fizer sentido, te envio condições e posso separar uma amostra. Se não, é só responder "não".`,
  email1_revenda: `Olá {nome},

Vi que {contexto}.

Sou o Gustavo, da Pindorama (cachaça artesanal do Vale do Café/RJ). Temos rótulos premium (Clássica, Ouro e Cobra Coral de jabuticaba) com boa saída no canal premium.

Posso te enviar mix sugerido e condições para avaliar na {nome}?

Se não fizer sentido, responda "não" que não insisto.`,
  email2: `Olá {nome},

Retomando rápido: falei há alguns dias da Pindorama (cachaça artesanal do Vale do Café/RJ) para a {nome}.

Se quiser, te envio 2 ideias de drinks com a Clássica/Ouro/Cobra Coral e as condições em uma mensagem curta. Faz sentido?

Se não for interesse, responda "não" que paro por aqui.`,
  email3: `Olá {nome},

Último toque por aqui para não insistir.

Se em algum momento fizer sentido testar a Pindorama (Clássica, Ouro ou Cobra Coral) na carta da {nome}, é só responder este e-mail que te envio condições e opções de amostra.

Sucesso aí!`,
};

Object.keys(TEMPLATES).forEach(k => { TEMPLATES[k] += SIGNATURE; });

const SUBJECTS = {
  bar: 'Cachaça artesanal para a carta de drinks da {nome}?',
  bar_coquetel: 'Cachaça artesanal para a carta de coquetéis da {nome}?',
  coquetelaria: 'Cachaça artesanal para a coquetelaria da {nome}?',
  gastrobar: 'Cachaça artesanal para os drinks do {nome}?',
  restaurante: 'Cachaça artesanal para drinks e caipirinhas na {nome}?',
  restaurante_premium: 'Cachaça artesanal para a carta de drinks da {nome}?',
  hotel: 'Cachaça artesanal para o bar do {nome}?',
  balada: 'Cachaça artesanal para os drinks da {nome}?',
  bistro: 'Cachaça artesanal para os drinks do {nome}?',
  'bistrô': 'Cachaça artesanal para os drinks do {nome}?',
  cafeteria: 'Cachaça artesanal para drinks especiais na {nome}?',
  steakhouse: 'Cachaça artesanal para caipirinhas e drinks na {nome}?',
  clube: 'Cachaça artesanal para os drinks do {nome}?',
  lounge: 'Cachaça artesanal para os drinks do {nome}?',
  wine_bar: 'Cachaça artesanal para a carta do {nome}?',
  pub: 'Cachaça artesanal para os drinks do {nome}?'
};

function pickTemplate(lead, step) {
  if (step === 'email1') {
    const t = String(lead.type || '').toLowerCase();
    const isResale = ['adega','loja_bebidas','distribuidora','distribuidor','atacadista','supermercado','emporio'].some(k => t.includes(k));
    const chosen = lead.template || (isResale ? 'revenda' : 'pergunta');
    return TEMPLATES['email1_' + chosen] || TEMPLATES.email1_consultivo;
  }
  return TEMPLATES[step];
}

function getSubject(lead, step) {
  const first = (String(lead.name || '').split(' ')[0] || 'sua casa').replace(/[<>]/g, '');
  if (step === 'email1') {
    const t = String(lead.type || '').toLowerCase();
    for (const k of Object.keys(SUBJECTS)) {
      if (t === k || t.includes(k)) return SUBJECTS[k].replace(/{nome}/g, first);
    }
    return `Cachaça artesanal para os drinks da ${first}?`;
  }
  if (step === 'email2') return `Posso te enviar sugestões de drinks para a ${first}?`;
  if (step === 'email3') return `Último toque — Pindorama para a ${first}`;
  return 'Pindorama';
}

async function sendEmail(lead, step) {
  const text = pickTemplate(lead, step).replace(/{nome}/g, (lead.name || '').split(' ')[0] || lead.name || '').replace(/{contexto}/g, lead.context || '');
  const bodyHtml = text
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px 0;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:640px;">
    <div style="padding:4px 0 8px 0;">
      ${bodyHtml}
    </div>
    <div style="margin-top:8px;">${GIF_TAG}</div>
  </div>`;
  const info = await transporter.sendMail({
    from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
    to: lead.email,
    subject: getSubject(lead, step),
    text, html
  });
  const todayStr = today();
  lead[step] = true;
  lead['date' + step.slice(-1)] = todayStr;
  return info;
}

function daysDiff(dateStr) {
  const d = new Date(dateStr);
  const n = new Date();
  return Math.floor((n - d) / (1000 * 60 * 60 * 24));
}

// --- Add new leads (CLI) ---
async function addLeads(jsonStr) {
  let newLeads;
  try { newLeads = JSON.parse(jsonStr); } catch(e) { console.error('Invalid JSON'); process.exit(1); }
  if (!Array.isArray(newLeads)) newLeads = [newLeads];

  const master = load(LEADS_FILE);
  const templates = ['consultivo', 'prova_social', 'pergunta'];
  let imported = 0;

  for (const l of newLeads) {
    if (!l.email || !l.name) { console.log('SKIP (missing name/email): ' + (l.name || '?')); continue; }
    if (SUPPRESSED_EMAILS.has(String(l.email).toLowerCase())) { console.log('SKIP (suppressed bounced address): ' + l.name); continue; }
    if (BLOCKED_RECIPIENT_DOMAINS.has(emailDomain(l.email))) { console.log('SKIP (blocked client domain): ' + l.name); continue; }
    const existing = master.find(x => String(x.email || '').toLowerCase() === String(l.email).toLowerCase());
    if (existing) {
      if (l.emailVerified === true) {
        const valid = l.mxVerified === true || await validateDNS(l.email);
        if (!valid) { console.log('FAIL DNS: ' + l.name + ' <' + l.email + '>'); continue; }
        const verifiedFields = ['name', 'type', 'neighborhood', 'address', 'context', 'phone', 'website',
          'emailVerified', 'emailSource', 'emailVerifiedAt', 'template'];
        for (const field of verifiedFields) {
          if (l[field] !== undefined && l[field] !== '') existing[field] = l[field];
        }
        imported++;
        console.log('UPDATE VERIFIED: ' + l.name + ' <' + l.email + '>');
      } else {
        console.log('SKIP (duplicate): ' + l.name);
      }
      continue;
    }

    const valid = l.mxVerified === true || await validateDNS(l.email);
    if (!valid) { console.log('FAIL DNS: ' + l.name + ' <' + l.email + '>'); continue; }

    l.neighborhood = l.neighborhood || '';
    l.type = l.type || 'bar';
    l.context = l.context || '';
    l.template = l.template || (l.type === 'balada' ? 'pergunta' : l.type === 'adega' ? 'consultivo' : templates[Math.floor(Math.random() * 3)]);
    l.website = l.website || '';
    master.push(l);
    imported++;
    console.log('ADD OK: ' + l.name + ' <' + l.email + '> [' + l.type + '/' + l.template + ']');
  }

  save(LEADS_FILE, master);
  console.log('Imported ' + imported + ' verified/new leads');
}

// --- Send email1 for new leads ---
async function sendEmail1(maxSent = Infinity) {
  let sent = 0;
  const failed = new Set();
  for (;;) {
    if (sent >= maxSent) break;
    const leads = load(LEADS_FILE);
    const contactedEmails = new Set(
      leads.filter(x => x.email1).map(x => String(x.email || '').toLowerCase())
    );
    const pending = leads
      .filter(x => x.name && !x.email1 && !contactedEmails.has(String(x.email || '').toLowerCase()) && !x.invalidEmail && !x.doNotContact && !failed.has(x.email) && x.email && isCocktailICP(x) && x.targetProfile === 'A/B' && !emailFrozen(x) && !x.emailCycleClosed)
      .sort((a, b) => leadPriority(b) - leadPriority(a));
    if (!pending.length) {
      if (sent === 0) {
        const base = leads.filter(x => x.name && !x.email1 && x.email);
        const stages = {
          total: leads.length,
          semEmail1_comEmail: base.length,
          semContato: base.filter(x => !contactedEmails.has(String(x.email).toLowerCase())).length,
          semInvalid: base.filter(x => !x.invalidEmail && !x.doNotContact).length,
          verificado: base.filter(x => x.emailVerified === true).length,
          comSourceData: base.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(String(x.emailVerifiedAt || '').trim())).length,
          elegivelTipo: base.filter(x => eligibleFirstContactType(x.type)).length,
          completo: base.filter(x => verifiedFirstContact(x)).length
        };
        console.log('DIAG: ' + JSON.stringify(stages));
      }
      break;
    }
    if (!emailQuotaAvailable()) break;
    const l = pending[0];
    try {
      const valid = l.mxVerified === true || await validateDNS(l.email);
      if (!valid) {
        suppressInvalidEmail(l.email, 'domain_without_mx');
        failed.add(l.email);
        console.log('EMAIL1 SUPRIMIDO (sem MX): ' + l.name + ' <' + l.email + '>');
        continue;
      }
      await sendEmail(l, 'email1');
      recordEmailOutput();
      // Force-persist: reload, find by email, set fields, save
      const reloaded = load(LEADS_FILE);
      const normalizedEmail = String(l.email).toLowerCase();
      const todayStr = today();
      let persisted = false;
      for (const item of reloaded) {
        if (String(item.email || '').toLowerCase() !== normalizedEmail) continue;
        item.email1 = true;
        item.date1 = todayStr;
        persisted = true;
      }
      if (persisted) {
        save(LEADS_FILE, reloaded);
      }
      console.log('EMAIL1 OK: ' + l.name + ' <' + l.email + '>');
      sent++;
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch(e) {
      failed.add(l.email);
      if (permanentRecipientError(e)) suppressInvalidEmail(l.email, 'permanent_recipient_error');
      console.log('EMAIL1 ERR ' + l.name + ': ' + e.message);
    }
  }
  return sent;
}

// --- Follow-ups (reativados 18/11/2026): no maximo 2 toques, 3-5 dias de
// intervalo, param imediatamente na primeira resposta e respeitam a quota. ---
const FOLLOWUP_MAX_PER_RUN = 5; // teto por execucao (workflow roda a cada 15 min)
async function sendFollowups(maxSent = Infinity) {
  let sent = 0;
  const failed = new Set();
  for (;;) {
    if (sent >= maxSent || sent >= FOLLOWUP_MAX_PER_RUN) break;
    if (!emailQuotaAvailable()) break;
    const leads = load(LEADS_FILE);
    const pending = leads
      .filter(x => x.name && x.email && x.email1 && isCocktailICP(x)
        && !hasResponded(x) && !x.invalidEmail && !x.doNotContact
        && !x.emailFrozenUntil && !x.emailCycleClosed && !failed.has(x.email)
        && followupStepDue(x))
      .sort((a, b) => {
        // Fecha o ciclo de quem ja recebeu o toque 2 primeiro.
        const sa = followupStepDue(a) === 'email3' ? 0 : 1;
        const sb = followupStepDue(b) === 'email3' ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return String(b.date2 || b.date1 || '').localeCompare(String(a.date2 || a.date1 || ''));
      });
    if (!pending.length) break;
    const l = pending[0];
    const step = followupStepDue(l);
    try {
      const valid = l.mxVerified === true || await validateDNS(l.email);
      if (!valid) {
        suppressInvalidEmail(l.email, 'domain_without_mx');
        failed.add(l.email);
        console.log(`FOLLOWUP SUPRIMIDO (sem MX): ${l.name} <${l.email}>`);
        continue;
      }
      await sendEmail(l, step);
      recordEmailOutput();
      const reloaded = load(LEADS_FILE);
      let persisted = false;
      for (const item of reloaded) {
        if (String(item.email || '').toLowerCase() !== String(l.email || '').toLowerCase()) continue;
        item[step] = true;
        item['date' + step.slice(-1)] = today();
        persisted = true;
      }
      if (persisted) save(LEADS_FILE, reloaded);
      console.log(`FOLLOWUP ${step} OK: ${l.name} <${l.email}>`);
      sent++;
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (e) {
      failed.add(l.email);
      if (permanentRecipientError(e)) suppressInvalidEmail(l.email, 'permanent_recipient_error');
      console.log(`FOLLOWUP ${step} ERR ${l.name}: ${e.message}`);
    }
  }
  return sent;
}

// --- Main ---
const args = process.argv.slice(2);
const configuredMaxPerRun = Number.parseInt(process.env.EMAIL_MAX_PER_RUN || '', 10);
const maxPerRun = Number.isFinite(configuredMaxPerRun) && configuredMaxPerRun > 0
  ? configuredMaxPerRun
  : Infinity;
if (args[0] === '--add') {
  await addLeads(args[1]);
  await sendEmail1(maxPerRun);
} else if (args[0] === '--add-only') {
  await addLeads(args[1]);
} else if (args[0] === '--add-file') {
  const content = readFileSync(args[1], 'utf-8');
  await addLeads(content);
  if (args[2] === '--send') await sendEmail1(maxPerRun);
} else if (args[0] === '--send') {
  await sendEmail1(maxPerRun);
} else if (args[0] === '--followup') {
  const s = await sendFollowups(maxPerRun);
  console.log('Follow-ups sent: ' + s);
} else if (args[0] === '--all') {
  const s1 = await sendEmail1(maxPerRun);
  const s2 = await sendFollowups(maxPerRun);
  console.log(`Email1: ${s1}, Follow-ups: ${s2}`);
} else {
  console.log('Usage:');
  console.log('  --add \'[...]\'       Add new leads (JSON string) + send');
  console.log('  --add-file <file>    Add leads from JSON file');
  console.log('  --add-file <file> --send  Add + send');
  console.log('  --send              Send email1 to pending leads');
  console.log('  --followup          Send email2/email3 due follow-ups');
  console.log('  --all               Send all pending (email1 + follow-ups)');
}
