import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const leads = JSON.parse(readFileSync(join(ROOT, 'leads-qualificados.json'), 'utf8'));
let waLog = [];
try { waLog = JSON.parse(readFileSync(join(ROOT, 'whatsapp-send-log.json'), 'utf8')); } catch {}

const now = new Date();
const today = now.toISOString().split('T')[0];
const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0];
const monthStart = today.slice(0, 8) + '01';
const yearStart = today.slice(0, 4) + '-01-01';

const inRange = (dateStr, start, end) => dateStr && dateStr >= start && dateStr <= end;
const isResponded = (l) => !!(l.responded || l.interested || l.replied || l.response);
const sendDates = (l) => [l.date1, l.date2, l.date3].filter(Boolean);
const inPeriod = (l, start, end) => sendDates(l).some(d => inRange(d, start, end));

// Daily (últimos 30 dias) para visão recente
const daily = {};
for (let i = 29; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  const key = d.toISOString().split('T')[0];
  daily[key] = { date: key, count: 0 };
}
leads.forEach((l) => {
  for (const d of sendDates(l)) { if (daily[d]) daily[d].count++; }
});
waLog.forEach((w) => {
  if (w.date && daily[w.date] && w.status === 'accepted') daily[w.date].count++;
});

const neighborhoods = {};
leads.forEach((l) => {
  const n = l.neighborhood || l.city || 'Sem bairro';
  neighborhoods[n] = (neighborhoods[n] || 0) + 1;
});

const segments = {};
leads.forEach((l) => {
  const s = l.type || 'outro';
  if (!segments[s]) segments[s] = { total: 0, email1: 0, responded: 0 };
  segments[s].total++;
  if (l.email1) segments[s].email1++;
  if (isResponded(l)) segments[s].responded++;
});

const weekLeads = leads.filter((l) => inPeriod(l, weekAgo, today));
const monthLeads = leads.filter((l) => inPeriod(l, monthStart, today));
const yearLeads = leads.filter((l) => inPeriod(l, yearStart, today));

const countEmails = (list) => ({
  email1: list.filter((l) => l.email1).length,
  email2: list.filter((l) => l.email2).length,
  email3: list.filter((l) => l.email3).length,
  total: list.filter((l) => l.email1).length + list.filter((l) => l.email2).length + list.filter((l) => l.email3).length,
  responses: list.filter(isResponded).length,
});

const emailsTotal = {
  email1: leads.filter((l) => l.email1).length,
  email2: leads.filter((l) => l.email2).length,
  email3: leads.filter((l) => l.email3).length,
};
emailsTotal.total = emailsTotal.email1 + emailsTotal.email2 + emailsTotal.email3;

const responsesTotal = leads.filter(isResponded).length;
const waAccepted = waLog.filter((w) => w.status === 'accepted');
const firstContact = sendDates(leads.flat ? leads : leads).length ? null : null;
const allSendDates = leads.flatMap(sendDates).sort();
const sinceDate = allSendDates[0] || null;

// Histórico mensal desde o início
const monthlyMap = {};
for (const l of leads) {
  for (const d of sendDates(l)) {
    const m = d.slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { month: m, email1: 0, email2: 0, email3: 0, total: 0 };
    if (d === l.date1) monthlyMap[m].email1++;
    if (d === l.date2) monthlyMap[m].email2++;
    if (d === l.date3) monthlyMap[m].email3++;
    monthlyMap[m].total++;
  }
}
const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

const pending = leads.filter((l) => !l.email1 && !l.invalidEmail && !l.doNotContact && l.email && l.emailVerified).length;

const data = {
  lastUpdate: new Date().toISOString(),
  sinceDate,
  totalLeads: leads.length,
  emails: emailsTotal,
  whatsapp: {
    today: waAccepted.filter((w) => w.date === today).length,
    total: waAccepted.length,
  },
  responses: responsesTotal,
  pending,
  daily: Object.values(daily),
  monthly,
  topNeighborhoods: Object.entries(neighborhoods)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count })),
  recentLeads: leads
    .filter((l) => l.email1 || l.date1)
    .sort((a, b) => String(b.date1 || b.emailVerifiedAt || '').localeCompare(String(a.date1 || a.emailVerifiedAt || '')))
    .slice(0, 12)
    .map((l) => ({
      name: l.name,
      type: l.type,
      neighborhood: l.neighborhood || l.city,
      city: l.city,
      responded: isResponded(l),
      email1: !!l.email1,
      date1: l.date1,
    })),
  funnel: {
    leads: leads.length,
    email1: emailsTotal.email1,
    email2: emailsTotal.email2,
    email3: emailsTotal.email3,
    responded: responsesTotal,
  },
  week: { leads: weekLeads.length, emails: countEmails(weekLeads) },
  month: { leads: monthLeads.length, emails: countEmails(monthLeads) },
  year: { leads: yearLeads.length, emails: countEmails(yearLeads) },
  sinceBeginning: {
    leads: leads.length,
    emails: emailsTotal,
    responses: responsesTotal,
    whatsapp: waAccepted.length,
    firstDate: sinceDate,
  },
  segments: Object.entries(segments)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, s]) => ({ name, ...s })),
};

writeFileSync(join(ROOT, 'dashboard-data.json'), JSON.stringify(data, null, 2));
console.log('dashboard-data.json:', data.totalLeads, 'leads | emails:', emailsTotal.total, '| desde:', sinceDate, '| respostas:', responsesTotal);
