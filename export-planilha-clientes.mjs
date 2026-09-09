import { readFileSync, writeFileSync, existsSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));

const phoneByLead = {};
for (const file of ['whatsapp-send-log.json', 'whatsapp-verified-queue.json']) {
  if (!existsSync(file)) continue;
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const arr = Array.isArray(data) ? data : (data.leads || []);
  for (const entry of arr) {
    if (entry.name && entry.phone) phoneByLead[entry.name] = entry.phone;
  }
}

const rows = [];
rows.push(['Nome', 'Email', 'WhatsApp', 'Fone', 'Cidade', 'Bairro', 'Tipo de Negocio', 'Email1', 'Email2', 'Email3', 'WhatsApp Enviado']);

for (const l of leads) {
  const addressPart = l.address && String(l.address).split('/')[0].trim();
  let cidade = l.city || addressPart || '';
  if (!cidade) cidade = (l.neighborhood && /^[A-ZÇ].*(Paulo|SP|Guarulhos|Osasco|Barueri|Cotia|Diadema|Santo Andre|Sao Bernardo|tabo|embu|itape|caieiras|franco|mogi|jundiai|campinas|sorocaba|maria|maua|ibiuna|sao caetano|santana de parnaiba|mairipora|sao jose dos campos)/i.test(l.neighborhood)) ? l.neighborhood : '';
  let bairro = l.neighborhood && l.neighborhood !== cidade ? l.neighborhood : '';
  rows.push([
    l.name || '',
    l.email || '',
    (l.whatsappSent && (phoneByLead[l.name] || l.phone)) || '',
    l.phone || '',
    cidade,
    bairro,
    l.type || '',
    l.date1 || '',
    l.date2 || '',
    l.date3 || '',
    l.whatsappDate || (l.whatsappSent ? 'sim' : ''),
  ]);
}

const escape = (v) => {
  const s = String(v ?? '');
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = '\uFEFF' + rows.map((r) => r.map(escape).join(';')).join('\r\n');
writeFileSync('planilha-clientes.csv', csv);
console.log('Planilha gerada: planilha-clientes.csv (' + leads.length + ' clientes)');