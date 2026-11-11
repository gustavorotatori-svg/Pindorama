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

const TYPE_PRIORITY = {
  adega: 100, loja_bebidas: 95, distribuidora: 90, distribuidor: 90,
  atacadista: 85, bar: 80, balada: 75, restaurante: 65,
  hotel: 55, catering: 50, clube: 45
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

const FIRST_CONTACT_TYPES = new Set([
  'adega', 'loja_bebidas', 'distribuidora', 'distribuidor',
  'atacadista', 'bar', 'balada', 'restaurante', 'buffet'
]);

function eligibleFirstContactType(type) {
  const normalized = String(type || '').toLowerCase();
  return FIRST_CONTACT_TYPES.has(normalized) ||
    /(^|_)(adega|loja|loja_bebidas|distribuidora|distribuidor|atacadista|bar|balada|restaurante|buffet|hotel|catering|supermercado|padaria|mercadinho|conveniencia|emporio|gelateria|sorveteria|churrascaria|chocolateria|confeitaria|carnes|pizzaria|hamburgueria|cafeteria|açaí|acai|bebidas|pizzar|massas|cervejaria|vinhoteca|fromagerie|charcutaria|rotisseria|marmitaria|lanchonete|sanduicheria|sushi|japonesa|italiana|francesa|espanhola|mediterranea|steakhouse|gastrobar|bistrô|bistro|fabrica|industria|microcervejaria|doceria)(_|$)/.test(normalized);
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

function verifiedFollowUp(lead) {
  // Para follow-ups: o email já foi entregue com sucesso (email1 enviado),
  // então não verificamos emailVerified nem tipo nem source.
  // Apenas verificamos que não está suprimido, não é domínio bloqueado,
  // não está congelado e não respondeu.
  if (SUPPRESSED_EMAILS.has(String(lead.email || '').toLowerCase())) return false;
  if (BLOCKED_RECIPIENT_DOMAINS.has(emailDomain(lead.email))) return false;
  return true;
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

Sou o Gustavo, da Pindorama (cachaça artesanal do Vale do Café/RJ). Trabalho com rótulos premium como a Pindorama Clássica, Pindorama Ouro e Cobra Coral (jabuticaba) — ótimos para caipirinhas e coquetéis autorais.

Faz sentido eu te enviar 2 sugestões de drinks e as condições para a {nome}? Se preferir, posso separar uma amostra para degustação.

Se não for do seu interesse, é só responder "não" que não insisto.`,
  email1_prova_social: `Olá {nome},

Vi que {contexto}.

Sou o Gustavo, da Pindorama — cachaça artesanal do Vale do Café (RJ), já presente em casas como Fasano, Hilton e Rosewood. Nossos rótulos (Clássica, Ouro e Cobra Coral de jabuticaba) funcionam muito bem em caipirinhas e coquetelaria.

Posso te mandar uma sugestão rápida de aplicação no bar e as condições para a {nome}? Também consigo levar amostra para teste.

Se não fizer sentido, responda "não" que encerro por aqui.`,
  email1_pergunta: `Olá {nome},

Pergunta rápida: a {nome} já trabalha com alguma cachaça artesanal premium na carta de drinks?

Vi que {contexto}. Sou o Gustavo, da Pindorama (Vale do Café/RJ) — temos rótulos como Clássica, Ouro e Cobra Coral (jabuticaba) que vão muito bem em caipirinhas e coquetéis.

Se fizer sentido, te envio condições e posso separar uma amostra para degustação. Se não, é só responder "não".`,
  email1_revenda: `Olá {nome},

Vi que {contexto}.

Sou o Gustavo, da Pindorama (cachaça artesanal do Vale do Café/RJ). Temos rótulos premium (Pindorama Clássica, Ouro e Cobra Coral de jabuticaba) com boa saída no canal premium.

Posso te enviar mix sugerido, condições e tabela para avaliar revenda na {nome}? Se preferir, começo com um pedido teste.

Se não fizer sentido, responda "não" que não insisto.`,
  email2: `Olá {nome},

Passando rápido: na semana passada falei da Pindorama (cachaça artesanal premium do Vale do Café/RJ).

Se fizer sentido para a {nome}, posso te enviar 2 sugestões de uso (bar ou revenda) + condições em uma mensagem curta. Quer que eu te mande?`,
  email3: `Olá {nome},

Último toque por aqui para não insistir.

Se em algum momento fizer sentido testar a Pindorama (Clássica, Ouro ou Cobra Coral) na {nome}, é só responder este e-mail que te envio condições e opções.

Sucesso aí!`,
};

Object.keys(TEMPLATES).forEach(k => { TEMPLATES[k] += SIGNATURE; });

const SUBJECTS = {
  bar: 'Cachaça artesanal para a carta de drinks',
  restaurante: 'Cachaça artesanal para drinks e caipirinhas',
  adega: 'Cachaça artesanal premium para o portfólio',
  loja_bebidas: 'Cachaça artesanal premium para sua loja',
  distribuidora: 'Cachaça artesanal premium para o portfólio B2B',
  hotel: 'Cachaça artesanal para o bar do hotel',
  balada: 'Cachaça artesanal para os drinks da casa',
  supermercado: 'Cachaça artesanal premium para gôndola',
  emporio: 'Cachaça artesanal premium para o empório',
  cafeteria: 'Cachaça artesanal para drinks especiais'
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
  if (step === 'email1') {
    const t = String(lead.type || '').toLowerCase();
    for (const k of Object.keys(SUBJECTS)) {
      if (t === k || t.includes(k)) return SUBJECTS[k];
    }
    return 'Cachaça artesanal premium da Pindorama';
  }
  if (step === 'email2') return 'Posso te enviar sugestões + condições?';
  if (step === 'email3') return 'Último toque — Pindorama';
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
      .filter(x => x.name && !x.email1 && !contactedEmails.has(String(x.email || '').toLowerCase()) && !x.invalidEmail && !x.doNotContact && !failed.has(x.email) && x.email && x.targetProfile === 'A/B' && !emailFrozen(x) && !x.emailCycleClosed)
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

// --- Send follow-ups (DESABILITADO ate 30/10 - foco 100% em email1 ate sexta-feira) ---
async function sendFollowups(maxSent = Infinity) {
  console.log('Follow-ups desativados temporariamente - foco em email1 apenas');
  return 0;
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
  console.log('Email1: ' + s1 + ', Follow-ups: 0 (desativados - foco email1)');
} else {
  console.log('Usage:');
  console.log('  --add \'[...]\'       Add new leads (JSON string) + send');
  console.log('  --add-file <file>    Add leads from JSON file');
  console.log('  --add-file <file> --send  Add + send');
  console.log('  --send              Send email1 to pending leads');
  console.log('  --followup          Send email2/email3 due follow-ups');
  console.log('  --all               Send all pending (email1 + follow-ups)');
}
