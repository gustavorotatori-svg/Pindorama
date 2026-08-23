import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import dns from 'dns';
import { emailQuotaAvailable, recordEmailOutput } from './email-quota.mjs';

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;

if (!MAIL_USER || !MAIL_PASS) {
  throw new Error('GMAIL_USER e GMAIL_APP_PASSWORD sao obrigatorios');
}
const LEADS_FILE = 'leads-qualificados.json';
const OLD_FILE = 'leads.json';
const SUPPRESSED_EMAILS_FILE = 'suppressed-emails.json';
const GIF_TAG = '<br><br><img src="https://iili.io/CkQ8gFR.gif" style="display:block;margin-top:12px;max-width:400px" />';
const DELAY_MS = 2500;
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

function verifiedFirstContact(lead) {
  if (SUPPRESSED_EMAILS.has(String(lead.email || '').toLowerCase())) return false;
  if (BLOCKED_RECIPIENT_DOMAINS.has(emailDomain(lead.email))) return false;
  if (!FIRST_CONTACT_TYPES.has(lead.type)) return false;
  if (lead.emailVerified !== true) return false;
  const source = String(lead.emailSource || '').trim();
  const verifiedAt = String(lead.emailVerifiedAt || '').trim();
  if (!/^https?:\/\//i.test(source) || !/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) return false;
  const ageDays = daysDiff(verifiedAt);
  return ageDays >= 0 && ageDays <= 90;
}

function permanentRecipientError(error) {
  const text = `${error?.responseCode || ''} ${error?.code || ''} ${error?.response || ''} ${error?.message || ''}`.toLowerCase();
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
  email1_consultivo: `Ol\u00e1 {nome},

Vi que {contexto} e pensei que a Pindorama faria sentido para voc\u00eas.

Somos uma cacha\u00e7a artesanal premium produzida em fazenda pr\u00f3pria no Vale do Caf\u00e9 (RJ). Al\u00e9m de atender hot\u00e9is como Fasano, Hilton e Rosewood, oferecemos um pacote completo para bares e restaurantes:

\u2022 Amostra gr\u00e1tis para conhecer a linha
\u2022 Degustadoras para fazer a\u00e7\u00f5es no seu estabelecimento
\u2022 Treinamento para sua equipe sobre o produto
\u2022 Bonifica\u00e7\u00e3o no primeiro pedido teste

Gostaria de saber se voc\u00eas trabalham com cacha\u00e7a no card\u00e1pio e se estariam abertos a conhecer nosso modelo.

Posso passar mais detalhes ou agendar uma visita?`,
  email1_prova_social: `Ol\u00e1 {nome},

Vi que {contexto} e gostaria de apresentar a Pindorama.

J\u00e1 estamos em contato com grupos como Fasano, Hilton e Rosewood, e a aceita\u00e7\u00e3o tem sido excelente. Produzimos cacha\u00e7a artesanal premium em fazenda pr\u00f3pria no Vale do Caf\u00e9 (RJ).

Nosso diferencial \u00e9 o suporte completo ao parceiro:

\u2022 Amostra gr\u00e1tis para avalia\u00e7\u00e3o
\u2022 Degustadoras para a\u00e7\u00f5es no sal\u00e3o
\u2022 Treinamento da equipe
\u2022 Bonifica\u00e7\u00e3o no pedido teste

Voc\u00eas teriam interesse em conhecer nossa linha e o que oferecemos?`,
  email1_pergunta: `Ol\u00e1 {nome},

Vi que {contexto} e fiquei curioso \u2014 voc\u00eas trabalham com cacha\u00e7a no card\u00e1pio atual?

Sou o Gustavo, da Pindorama. Produzimos cacha\u00e7a artesanal premium no Vale do Caf\u00e9 (RJ) e oferecemos um suporte completo para bares e restaurantes:

\u2022 Amostra gr\u00e1tis para testar a linha
\u2022 Degustadoras para a\u00e7\u00f5es com seus clientes
\u2022 Treinamento para gar\u00e7ons e equipe
\u2022 Bonifica\u00e7\u00e3o no primeiro pedido

Faz sentido para voc\u00eas conhecer?

Vale uma troca de ideia r\u00e1pida?`,
  email2: `Ol\u00e1 {nome},

Tudo bem? Semana passada entrei em contato apresentando a Pindorama.

Al\u00e9m da cacha\u00e7a artesanal premium, queria refor\u00e7ar o que oferecemos para parceiros:

\u2022 Amostra gr\u00e1tis para conhecer a linha
\u2022 Degustadoras para a\u00e7\u00f5es no estabelecimento
\u2022 Treinamento completo para equipe
\u2022 Bonifica\u00e7\u00e3o no primeiro pedido teste

Gostaria de saber se faz sentido para o card\u00e1pio de voc\u00eas. Posso passar os detalhes ou agendar uma visita para conversarmos.`,
  email3: `Ol\u00e1 {nome},

Esse \u00e9 meu \u00faltimo contato \u2014 n\u00e3o quero perder a chance de voc\u00eas conhecerem a Pindorama.

Nosso pacote completo para parceiros:

\u2022 Amostra gr\u00e1tis para avalia\u00e7\u00e3o
\u2022 Degustadoras para a\u00e7\u00f5es no sal\u00e3o
\u2022 Treinamento da equipe
\u2022 Bonifica\u00e7\u00e3o no primeiro pedido
\u2022 Frete CIF e pagamento em 21 dias

Se quiser testar, \u00e9 s\u00f3 me enviar os dados cadastrais que emito a NF de Amostra Gr\u00e1tis.

Pode responder esse email ou me ligar.`
};

Object.keys(TEMPLATES).forEach(k => { TEMPLATES[k] += SIGNATURE; });

const SUBJECTS = {
  bar: 'Cacha\u00e7a artesanal premium para seu bar',
  restaurante: 'Cacha\u00e7a artesanal premium para seu restaurante',
  adega: 'Cacha\u00e7a artesanal premium para sua adega',
  loja_bebidas: 'Cacha\u00e7a artesanal premium para sua loja de bebidas',
  distribuidora: 'Cacha\u00e7a Pindorama para sua distribuidora de bebidas',
  hotel: 'Cacha\u00e7a artesanal premium para seu hotel',
  balada: 'Cacha\u00e7a Pindorama para sua balada'
};

function pickTemplate(lead, step) {
  if (step === 'email1') {
    const t = lead.template || 'consultivo';
    return TEMPLATES['email1_' + t];
  }
  return TEMPLATES[step];
}

function getSubject(lead, step) {
  if (step === 'email1') {
    return SUBJECTS[lead.type] || 'Cacha\u00e7a artesanal premium Pindorama';
  }
  if (step === 'email2') return 'Sobre a Pindorama';
  return '\u00daltimo contato \u2014 oferta especial de lan\u00e7amento Pindorama';
}

async function sendEmail(lead, step) {
  const text = pickTemplate(lead, step).replace(/{nome}/g, lead.name.split(' ')[0]).replace(/{contexto}/g, lead.context || '');
  const html = text.replace(/\n/g, '<br>') + GIF_TAG;
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
        const valid = await validateDNS(l.email);
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

    const valid = await validateDNS(l.email);
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
async function sendEmail1() {
  let sent = 0;
  const failed = new Set();
  for (;;) {
    const leads = load(LEADS_FILE);
    const contactedEmails = new Set(
      leads.filter(x => x.email1).map(x => String(x.email || '').toLowerCase())
    );
    const pending = leads
      .filter(x => !x.email1 && !contactedEmails.has(String(x.email || '').toLowerCase()) && !x.invalidEmail && !x.doNotContact && !failed.has(x.email) && x.email && verifiedFirstContact(x))
      .sort((a, b) => leadPriority(b) - leadPriority(a));
    if (!pending.length) break;
    if (!emailQuotaAvailable()) break;
    const l = pending[0];
    try {
      const valid = await validateDNS(l.email);
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

// --- Send follow-ups ---
async function sendFollowups() {
  let sent = 0;
  const failed = new Set();
  for (;;) {
    const leads = load(LEADS_FILE);
    let target = null;
    for (const l of leads) {
      if (l.responded || l.invalidEmail || l.doNotContact || SUPPRESSED_EMAILS.has(String(l.email || '').toLowerCase())) continue;
      if (!verifiedFirstContact(l)) continue;
      if (l.email1 && !l.email2 && l.date1 && daysDiff(l.date1) >= 2 && !failed.has(l.email + ':email2')) { target = {lead:l,step:'email2'}; break; }
      if (l.email2 && !l.email3 && l.date2 && daysDiff(l.date2) >= 4 && !failed.has(l.email + ':email3')) { target = {lead:l,step:'email3'}; break; }
    }
    if (!target) break;
    if (!emailQuotaAvailable()) break;
    const {lead:l, step} = target;
    try {
      await sendEmail(l, step);
      recordEmailOutput();
      // Force-persist
      const reloaded = load(LEADS_FILE);
      const normalizedEmail = String(l.email).toLowerCase();
      const todayStr = today();
      let persisted = false;
      for (const item of reloaded) {
        if (String(item.email || '').toLowerCase() !== normalizedEmail) continue;
        item[step] = true;
        item['date' + step.slice(-1)] = todayStr;
        persisted = true;
      }
      if (persisted) {
        save(LEADS_FILE, reloaded);
      }
      console.log((step === 'email2' ? 'EMAIL2' : 'EMAIL3') + ' OK: ' + l.name + ' <' + l.email + '>');
      sent++;
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch(e) {
      failed.add(l.email + ':' + step);
      if (permanentRecipientError(e)) suppressInvalidEmail(l.email, 'permanent_recipient_error');
      console.log((step === 'email2' ? 'EMAIL2' : 'EMAIL3') + ' ERR ' + l.name + ': ' + e.message);
    }
  }
  return sent;
}

// --- Main ---
const args = process.argv.slice(2);
if (args[0] === '--add') {
  await addLeads(args[1]);
  await sendEmail1();
} else if (args[0] === '--add-only') {
  await addLeads(args[1]);
} else if (args[0] === '--add-file') {
  const content = readFileSync(args[1], 'utf-8');
  await addLeads(content);
  if (args[2] === '--send') await sendEmail1();
} else if (args[0] === '--send') {
  await sendEmail1();
} else if (args[0] === '--followup') {
  const s = await sendFollowups();
  console.log('Follow-ups sent: ' + s);
} else if (args[0] === '--all') {
  const s1 = await sendEmail1();
  const s2 = await sendFollowups();
  console.log('Email1: ' + s1 + ', Follow-ups: ' + s2);
} else {
  console.log('Usage:');
  console.log('  --add \'[...]\'       Add new leads (JSON string) + send');
  console.log('  --add-file <file>    Add leads from JSON file');
  console.log('  --add-file <file> --send  Add + send');
  console.log('  --send              Send email1 to pending leads');
  console.log('  --followup          Send email2/email3 due follow-ups');
  console.log('  --all               Send all pending (email1 + follow-ups)');
}
