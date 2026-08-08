import fs from 'fs';

const buf = fs.readFileSync('data/planilha-paralela.csv');
const txt = buf.toString('latin1');
const lines = txt.split(/\r?\n/);
const rows = lines.map(parseCSVLine);
const hdr = rows[0].map(h => h.trim().toUpperCase());
const idx = k => hdr.indexOf(k);
const iName = idx('NOME'), iCat = idx('CATEGORIA'), iTel = idx('TELEFONE'),
      iEmail = idx('EMAIL'), iCont = idx('CONTATO'), iInst = idx('INSTAGRAM'), iAdd = idx('ENDEREÇO');
const data = rows.slice(1).filter(r => r.length > 1 && r[iName] && r[iName].trim());

// Load existing leads for dedup
const master = JSON.parse(fs.readFileSync('leads-qualificados.json', 'utf-8'));
const legacy = JSON.parse(fs.readFileSync('leads.json', 'utf-8'));
const known = new Set([...master, ...legacy].map(x => (x.email || '').toLowerCase().trim()));
const previous = fs.existsSync('leads-planilha.json')
  ? JSON.parse(fs.readFileSync('leads-planilha.json', 'utf-8'))
  : [];
const processedByEmail = new Map(previous.map(x => [
  (x.email || '').toLowerCase().trim(),
  Boolean(x.processed)
]));

// Normalize + extract first valid email per row
function extractEmails(raw) {
  if (!raw) return [];
  const parts = raw.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
  return parts.filter(p => /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(p));
}

function normalizeName(raw) {
  const n = raw.replace(/\s+/g, ' ').trim();
  return n.length > 60 ? n.slice(0, 57) + '...' : n;
}

function mapType(cat) {
  const c = (cat || '').toUpperCase();
  if (/(HOTEL|HOTÉIS|HOTELARIA|POUSADA|HOSTEL|RESORT|HOSPEDAGEM)/.test(c)) return 'hotel';
  if (/(CATERING|BUFFET|BANQUETE|EVENTOS CORPORATIVOS|GASTRONOMIA PARA EVENTOS)/.test(c)) return 'catering';
  if (/(CLUBE SOCIAL|CLUBE ESPORTIVO|CLUBE RECREATIVO|ASSOCIAÇÃO ESPORTIVA|COUNTRY CLUB|IATE CLUBE)/.test(c)) return 'clube';
  if (/(ADEGA|WINE|VINHO|LOJA DE BEBID|CERVEJARIA|CERVEJA|CHOPE|BEBIDA|BEBIDAS)/.test(c)) return 'adega';
  if (/(BAR|BOTECO|PUB|DRINK|COQUETEL|GASTROBAR|CHOPERIA|BALADA|CASA DE SHOWS|AGITO|MUSICA)/.test(c)) return 'bar';
  if (/(PIZZARIA|HAMBURGUERIA|RESTAURANTE|CAFÉ|PADARIA|DOCERIA|CHURRASCARIA|LANCHONETE|SORVETERIA|DELIVERY|FOOD|SALGADOS|DOCES|SUSHI|JAPA|ITALIANO|FRUTOS|CARNE|CONFEITARIA|POKE|GELATO|BRUNCH|BISTRO|TRATTORIA|EMPÓRIO|MERCADO|MERCADOS)/.test(c)) return 'restaurante';
  return 'outro';
}
const NON_FOOD = /MÓVEIS|ROUPAS|CONSTRUÇÃO|MOTEL|QUADRA DE AREIA|RELIGIOSO|ENTRETENIMENTO|SUSTENTABILIDADE|LATICINIOS|ESCOLA|PRODUTORES DE CAFE|FORNECEDORES|CAFÉ E CURSO/;
function isFoodOrRelevant(c) {
  const up = (c || '').toUpperCase();
  if (NON_FOOD.test(up)) return false;
  if (/N\/I|VARIADOS|TEMATIC|DIVERSOS/.test(up)) return true;
  return true;
}

function guessNeighborhood(addr) {
  if (!addr) return '';
  const m = addr.match(/-\s*([^,;]+)\s*(?:-|$)/);
  if (m) return m[1].trim();
  const m2 = addr.match(/[Bb]airro\s+([A-Za-zÀ-ú ]+)/);
  if (m2) return m2[1].trim();
  return '';
}

const out = [];
const dupCount = { known: 0, within: 0 };
const seenEmails = new Set();

for (const r of data) {
  const emails = extractEmails(r[iEmail]);
  if (!emails.length) continue;
  const email = emails[0].toLowerCase().trim();
  if (known.has(email)) { dupCount.known++; continue; }
  if (seenEmails.has(email)) { dupCount.within++; continue; }
  seenEmails.add(email);

  const cat = r[iCat] ? r[iCat].trim() : 'N/I';
  if (!isFoodOrRelevant(cat)) continue;
  const mappedType = mapType(cat);
  const type = mappedType === 'outro' ? 'restaurante' : mappedType;
  const contato = r[iCont] ? r[iCont].trim() : '';
  const tel = r[iTel] ? r[iTel].trim() : '';
  const addr = r[iAdd] ? r[iAdd].trim() : '';
  const insta = r[iInst] ? r[iInst].trim() : '';

  out.push({
    name: normalizeName(r[iName]),
    email,
    type,
    neighborhood: guessNeighborhood(addr),
    address: addr,
    context: [cat, contato ? 'responsável: ' + contato : '', insta ? 'instagram: ' + insta : ''].filter(Boolean).join('; '),
    phone: tel,
    template: type === 'adega' ? 'consultivo' : type === 'balada' ? 'pergunta' : '',
    processed: processedByEmail.get(email) || false
  });
}

fs.writeFileSync('leads-planilha.json', JSON.stringify(out, null, 2));
console.log('Total linhas planilha:', data.length);
console.log('Emails extraídos (novos, após dedup):', out.length);
console.log('Duplicatas vs cadastro:', dupCount.known);
console.log('Duplicatas dentro da planilha:', dupCount.within);
const byType = {};
out.forEach(l => { byType[l.type] = (byType[l.type] || 0) + 1; });
console.log('Por tipo:', JSON.stringify(byType));
const byCat = {};
out.forEach(l => {
  const c = (l.context.split(';')[0] || 'N/I').trim();
  byCat[c] = (byCat[c] || 0) + 1;
});
const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('Top 20 categorias:', JSON.stringify(top));

function parseCSVLine(l) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (q) {
      if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
