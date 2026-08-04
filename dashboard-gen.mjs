import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf-8'));
const old = JSON.parse(readFileSync('leads.json', 'utf-8'));

const total = leads.length + old.length;
const email1 = leads.filter(l => l.email1).length + old.filter(l => l.email1).length;
const email2 = leads.filter(l => l.email2).length + old.filter(l => l.email2).length;
const email3 = leads.filter(l => l.email3).length + old.filter(l => l.email3).length;
const totalEnvs = email1 + email2 + email3;
const responded = [...leads, ...old].filter(l => l.responded);
const verified = leads.filter(l => l.email1).length;

const segmentos = {};
const bairros = {};
const timeline = {};

for (const l of leads) {
  segmentos[l.type] = (segmentos[l.type] || 0) + 1;
  bairros[l.neighborhood] = (bairros[l.neighborhood] || 0) + 1;
  const d = l.date1;
  if (d) timeline[d] = (timeline[d] || 0) + 1;
}
for (const l of old) {
  if (!segmentos[l.type]) segmentos[l.type] = 0;
  const d = l.date1;
  if (d) timeline[d] = (timeline[d] || 0) + 1;
}

const segKeys = Object.keys(segmentos).sort();
const bairroKeys = Object.keys(bairros).sort((a,b) => bairros[b]-bairros[a]);
const timeKeys = Object.keys(timeline).sort();

function bar(value, max, color = '#4CAF50') {
  const pct = max > 0 ? (value / max * 100) : 0;
  return `<div class="bar-container"><div class="bar" style="width:${pct}%;background:${color}"></div><span class="bar-label">${value}</span></div>`;
}

function timelineSvg(data) {
  const max = Math.max(...Object.values(data));
  const w = 400, h = 200, pad = 30;
  const cols = Object.keys(data).length;
  const bw = Math.min(40, (w - pad) / cols - 4);
  let bars = '';
  let labels = '';
  Object.keys(data).forEach((k, i) => {
    const x = pad + i * (bw + 4);
    const bh = (data[k] / max) * (h - pad - 10);
    bars += `<rect x="${x}" y="${h - bh - 10}" width="${bw}" height="${bh}" fill="#2196F3" rx="2"/>`;
    labels += `<text x="${x + bw/2}" y="${h - 5}" text-anchor="middle" font-size="9" fill="#666">${k.slice(5)}</text>`;
  });
  return `<svg width="${w}" height="${h}">${bars}${labels}</svg>`;
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pindorama — Dashboard</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
body { background:#f0f2f5; padding:24px; color:#333; }
.container { max-width:960px; margin:0 auto; }
h1 { font-size:24px; margin-bottom:4px; color:#1a1a2e; }
.subtitle { color:#666; margin-bottom:24px; font-size:14px; }
.cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:24px; }
.card { background:white; border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,.08); text-align:center; }
.card .num { font-size:32px; font-weight:700; color:#1a1a2e; }
.card .lbl { font-size:12px; color:#888; margin-top:2px; }
.card.green .num { color:#4CAF50; }
.card.blue .num { color:#2196F3; }
.card.orange .num { color:#FF9800; }
.card.purple .num { color:#9C27B0; }
.card.red .num { color:#f44336; }
.section { background:white; border-radius:12px; padding:20px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,.08); }
.section h2 { font-size:16px; margin-bottom:12px; color:#1a1a2e; display:flex; align-items:center; gap:8px; }
.bar-container { display:flex; align-items:center; margin-bottom:6px; gap:8px; }
.bar { height:24px; border-radius:4px; min-width:2px; transition:width .3s; }
.bar-label { font-size:13px; color:#555; white-space:nowrap; min-width:24px; }
.row { display:flex; justify-content:space-between; margin-bottom:6px; padding:4px 0; border-bottom:1px solid #f0f0f0; font-size:14px; }
.row:last-child { border-bottom:none; }
.row .name { color:#555; }
.row .val { font-weight:600; color:#1a1a2e; }
svg { max-width:100%; height:auto; }
.resposta { background:#e8f5e9; border-radius:8px; padding:12px; margin-top:12px; }
.resposta strong { color:#2e7d32; }
.tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }
.tag.bar { background:#E3F2FD; color:#1565C0; }
.tag.restaurante { background:#FCE4EC; color:#C62828; }
.tag.adega { background:#FFF3E0; color:#E65100; }
.tag.hotel { background:#F3E5F5; color:#6A1B9A; }
.tag.balada { background:#E8F5E9; color:#2E7D32; }
.chart-row { display:flex; flex-wrap:wrap; gap:24px; }
.chart-col { flex:1; min-width:200px; }
@media(max-width:600px) { .cards { grid-template-columns: repeat(3, 1fr); } }
</style>
</head>
<body>
<div class="container">
  <h1>Pindorama</h1>
  <div class="subtitle">Dashboard de Prospec\u00e7\u00e3o — Atualizado em ${new Date().toLocaleString('pt-BR')}</div>

  <div class="cards">
    <div class="card green"><div class="num">${total}</div><div class="lbl">Leads</div></div>
    <div class="card blue"><div class="num">${totalEnvs}</div><div class="lbl">Envios</div></div>
    <div class="card orange"><div class="num">${responded.length}</div><div class="lbl">Respostas</div></div>
    <div class="card purple"><div class="num">${verified}</div><div class="lbl">DNS V\u00e1lidos</div></div>
    <div class="card red"><div class="num">${email3}</div><div class="lbl">\u00dalt. Tentativa</div></div>
  </div>

  <div class="section">
    <h2>Seq\u00fc\u00eancia de Envios</h2>
    <div class="cards" style="grid-template-columns:repeat(3,1fr);margin-bottom:0">
      <div class="card" style="background:#E3F2FD"><div class="num" style="color:#1565C0">${email1}</div><div class="lbl">Email 1</div></div>
      <div class="card" style="background:#FFF3E0"><div class="num" style="color:#E65100">${email2}</div><div class="lbl">Email 2</div></div>
      <div class="card" style="background:#FCE4EC"><div class="num" style="color:#C62828">${email3}</div><div class="lbl">Email 3</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Segmentos</h2>
    <div class="chart-row">
      <div class="chart-col">
        ${segKeys.map(k => {
          const colors = {bar:'#1565C0',restaurante:'#C62828',adega:'#E65100',hotel:'#6A1B9A',balada:'#2E7D32'};
          return '<div class="row"><span><span class="tag ' + k + '">' + k + '</span> ' + k + '</span><span class="val">' + segmentos[k] + '</span></div>';
        }).join('')}
      </div>
      <div class="chart-col">
        ${segKeys.map(k => {
          const max = Math.max(...Object.values(segmentos));
          const colors = {bar:'#1565C0',restaurante:'#C62828',adega:'#E65100',hotel:'#6A1B9A',balada:'#2E7D32'};
          return bar(segmentos[k], max, colors[k] || '#999');
        }).join('')}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Bairros (Top 10)</h2>
    ${bairroKeys.slice(0,10).map(k => {
      const max = bairroKeys.length > 0 ? bairros[bairroKeys[0]] : 1;
      return '<div class="row"><span class="name">' + k + '</span><span class="val">' + bairros[k] + '</span></div>';
    }).join('')}
    <div style="margin-top:8px">
      ${bairroKeys.slice(0,10).map(k => {
        const max = bairroKeys.length > 0 ? bairros[bairroKeys[0]] : 1;
        return bar(bairros[k], max, '#2196F3');
      }).join('')}
    </div>
  </div>

  <div class="section">
    <h2>Timeline de Envios</h2>
    ${timelineSvg(timeline)}
  </div>

  ${responded.length > 0 ? '<div class="section"><h2>Respostas</h2>' + responded.map(r => '<div class="resposta"><strong>' + r.name + '</strong> (' + r.email + ')<br>' + (r.response || 'respondeu') + '</div>').join('') + '</div>' : ''}

  <div class="section" style="text-align:center;color:#999;font-size:12px">
    Pindorama Cacha\u00e7a Artesanal — gerado automaticamente
  </div>
</div>
</body>
</html>`;

const outPath = 'dashboard.html';
writeFileSync(outPath, html);
console.log('Dashboard gerado: ' + outPath);
