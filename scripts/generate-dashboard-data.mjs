import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const leads = JSON.parse(readFileSync(join(ROOT, 'leads-qualificados.json'), 'utf8'));
const waLog = JSON.parse(readFileSync(join(ROOT, 'whatsapp-send-log.json'), 'utf8'));

const today = new Date().toISOString().split('T')[0];

const daily = {};
for (let i = 13; i >= 0; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const key = d.toISOString().split('T')[0];
  daily[key] = { date: key, count: 0 };
}

leads.forEach((l) => {
  if (l.date1 && daily[l.date1]) daily[l.date1].count++;
  if (l.date2 && daily[l.date2]) daily[l.date2].count++;
  if (l.date3 && daily[l.date3]) daily[l.date3].count++;
});

waLog.forEach((w) => {
  if (w.date && daily[w.date]) daily[w.date].count++;
});

const neighborhoods = {};
leads.forEach((l) => {
  const n = l.neighborhood || l.city || 'Sem bairro';
  neighborhoods[n] = (neighborhoods[n] || 0) + 1;
});

const data = {
  lastUpdate: new Date().toISOString(),
  totalLeads: leads.length,
  allLeads: leads.map((l) => ({
    name: l.name,
    type: l.type,
    neighborhood: l.neighborhood,
    city: l.city,
    email: l.email,
    emailVerified: l.emailVerified,
    invalidEmail: l.invalidEmail,
    doNotContact: l.doNotContact,
    email1: l.email1,
    date1: l.date1,
    email2: l.email2,
    date2: l.date2,
    email3: l.email3,
    date3: l.date3,
    responded: l.responded,
    responseDate: l.responseDate,
  })),
  emails: {
    email1: leads.filter((l) => l.email1).length,
    email2: leads.filter((l) => l.email2).length,
    email3: leads.filter((l) => l.email3).length,
    total: leads.filter((l) => l.email1).length + leads.filter((l) => l.email2).length + leads.filter((l) => l.email3).length,
  },
  whatsapp: {
    today: waLog.filter((w) => w.date === today && w.status === 'accepted').length,
    total: waLog.filter((w) => w.status === 'accepted').length,
  },
  responses: leads.filter((l) => l.responded).length,
  pending: leads.filter((l) => !l.email1 && !l.invalidEmail && !l.doNotContact && l.email && l.emailVerified).length,
  daily: Object.values(daily),
  topNeighborhoods: Object.entries(neighborhoods)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count })),
  recentLeads: leads
    .sort((a, b) => new Date(b.emailVerifiedAt || 0) - new Date(a.emailVerifiedAt || 0))
    .slice(0, 10)
    .map((l) => ({
      name: l.name,
      type: l.type,
      neighborhood: l.neighborhood,
      city: l.city,
      responded: l.responded,
      email1: l.email1,
    })),
  funnel: {
    leads: leads.length,
    email1: leads.filter((l) => l.email1).length,
    email2: leads.filter((l) => l.email2).length,
    email3: leads.filter((l) => l.email3).length,
    responded: leads.filter((l) => l.responded).length,
  },
};

writeFileSync(join(ROOT, 'dashboard-data.json'), JSON.stringify(data, null, 2));
console.log('dashboard-data.json gerado:', data.totalLeads, 'leads,', data.emails.total, 'emails');
