import fs from 'fs';

const SRC = 'leads-planilha.json';
const BATCH = 'lote-planilha.json';

const leads = JSON.parse(fs.readFileSync(SRC, 'utf-8'));

// Selection order: adega > bar > restaurante (qualidade do fit)
const order = { adega: 0, bar: 1, restaurante: 2 };
const pending = leads.filter(l => !l.processed).sort((a, b) => order[a.type] - order[b.type]);

const BATCH_SIZE = parseInt(process.argv[2] || '100', 10);
const batch = pending.slice(0, BATCH_SIZE);

// Build pipeline-ready objects (exclude internal fields)
const out = batch.map(l => ({
  name: l.name,
  email: l.email,
  type: l.type,
  neighborhood: l.neighborhood || '',
  address: l.address || '',
  context: l.context || '',
  phone: l.phone || '',
  template: l.template || '',
  website: l.website || ''
}));

fs.writeFileSync(BATCH, JSON.stringify(out, null, 2));

// Mark selected as processed (they'll be tried; even if MX fails we won't retry blindly)
const byEmail = new Set(batch.map(l => l.email));
for (const l of leads) if (byEmail.has(l.email)) l.processed = true;
fs.writeFileSync(SRC, JSON.stringify(leads, null, 2));

const remaining = leads.filter(l => !l.processed).length;
console.log('Lote gerado:', out.length, '->', BATCH);
console.log('Prioridade:', JSON.stringify(batch.reduce((a, l) => { a[l.type] = (a[l.type] || 0) + 1; return a; }, {})));
console.log('Restantes p/ próximos dias:', remaining);
