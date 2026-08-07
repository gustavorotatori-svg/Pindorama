/**
 * RELATÓRIO SEMANAL PDF — Pindorama (toda quinta)
 * Uso: node weekly-report.mjs
 * Gera: reports/relatorio-YYYY-MM-DD.pdf (dashboard + resumo do que foi feito)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execFileSync, spawnSync } from 'child_process';
import { exec } from 'child_process';
import { join } from 'path';

const isWin = process.platform === 'win32';

function killChrome() {
  return new Promise(resolve => {
    if (!isWin) return resolve();
    exec('taskkill /F /IM chrome.exe /T', () => resolve());
  });
}

const CHROME_CANDIDATES = isWin
  ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe']
  : ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
const LEADS_FILE = 'leads-qualificados.json';
const OLD_FILE = 'leads.json';
const PLAN_FILE = 'leads-planilha.json';

function load(file) { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : []; }

const qualified = load(LEADS_FILE);
const oldLeads = load(OLD_FILE);
const all = [...oldLeads, ...qualified];

const today = new Date();
const todayStr = today.toLocaleDateString('en-CA');
const wkStart = new Date(); wkStart.setDate(wkStart.getDate() - 6); wkStart.setHours(0,0,0,0);
const wkStartStr = wkStart.toLocaleDateString('en-CA');
const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const e1 = all.filter(x => x.email1);
const e2 = all.filter(x => x.email2);
const e3 = all.filter(x => x.email3);
const responses = all.filter(x => x.response);
const rate = e1.length ? ((responses.length / e1.length) * 100).toFixed(2) : '0.00';

// Últimos 7 dias
const daily = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date(); d.setDate(d.getDate() - i);
  const s = d.toLocaleDateString('en-CA');
  const dd = new Date(d);
  const label = days[dd.getDay()] + ' ' + dd.getDate() + '/' + (dd.getMonth()+1);
  const total = all.filter(x => (x.email1 && x.date1 === s) || (x.email2 && x.date2 === s) || (x.email3 && x.date3 === s)).length;
  const newLeads = all.filter(x => x.email1 && x.date1 === s).length;
  daily.push({ label, total, newLeads });
}

// Segmentos
const segs = {};
qualified.forEach(l => {
  const t = l.type || 'outro';
  segs[t] = segs[t] || { total: 0, sent: 0 };
  segs[t].total++;
  if (l.email1) segs[t].sent++;
});

// Status operacional
const pending = qualified.filter(x => x.email && !x.email1).length;
const waTotal = qualified.filter(x => x.whatsappSent).length;
const waToday = qualified.filter(x => x.whatsappSent && x.whatsappDate === todayStr).length;
const plan = load(PLAN_FILE);
const planProc = plan.filter(x => x.processed).length;

// Resumo semanal (markdown do AGENTS.md?)
let weeklyNotes = '';
if (existsSync('AGENTS.md')) {
  const md = readFileSync('AGENTS.md', 'utf-8');
  const lines = md.split('\n').filter(l => /^\d{2}\/\d{2}/.test(l));
  weeklyNotes = lines.slice(0, 12).join('\n');
}

const segHtml = Object.entries(segs).map(([t, d]) => `
  <div class="seg">
    <div class="seg-nome">${t}</div>
    <div class="seg-num">${d.sent}/${d.total}</div>
    <div class="bar"><div class="bar-fill" style="width:${d.total ? Math.round(d.sent/d.total*100) : 0}%"></div></div>
  </div>`).join('');

const dailyHtml = daily.map(d => `
  <div class="day">
    <div class="day-label">${d.label}</div>
    <div class="day-total">${d.total}</div>
    <div class="day-sub">${d.newLeads} novos</div>
    <div class="bar"><div class="bar-fill" style="width:${d.total ? Math.min(100, d.total/120*100) : 0}%"></div></div>
  </div>`).join('');

const respHtml = responses.length
  ? responses.map(r => `<li>${r.name} — ${r.response}</li>`).join('')
  : '<li>Nenhuma resposta esta semana</li>';

const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório Semanal Pindorama — ${todayStr}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 28px; }
  h1 { font-size: 24px; color: #1a1a2e; }
  h2 { font-size: 15px; color: #1a1a2e; margin: 22px 0 10px; border-bottom: 2px solid #f0c040; padding-bottom: 5px; }
  .sub { color: #888; font-size: 12px; margin-top: 4px; }
  .cards { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  .card { flex: 1; min-width: 150px; background: #f7f8fb; border-radius: 10px; padding: 14px; border-left: 4px solid #f0c040; }
  .card .n { font-size: 26px; font-weight: 700; }
  .card .l { font-size: 11px; color: #666; margin-top: 3px; }
  .grid { display: flex; gap: 12px; }
  .panel { flex: 1; background: #f7f8fb; border-radius: 10px; padding: 14px; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid #eee; }
  .row span:last-child { font-weight: 600; }
  .seg { margin: 8px 0; }
  .seg-nome { font-size: 12px; color: #555; text-transform: capitalize; }
  .seg-num { font-size: 13px; font-weight: 700; float: right; }
  .bar { background: #e6e6ee; border-radius: 6px; height: 8px; margin-top: 4px; overflow: hidden; }
  .bar-fill { background: linear-gradient(90deg, #f0c040, #e07b39); height: 100%; border-radius: 6px; }
  .days { display: flex; gap: 8px; margin-top: 8px; }
  .day { flex: 1; text-align: center; background: #f7f8fb; border-radius: 8px; padding: 10px 6px; }
  .day-label { font-size: 11px; color: #777; }
  .day-total { font-size: 18px; font-weight: 700; margin-top: 4px; }
  .day-sub { font-size: 10px; color: #999; }
  ul { padding-left: 18px; font-size: 13px; line-height: 1.6; }
  .foot { margin-top: 26px; font-size: 11px; color: #aaa; text-align: center; }
  .warn { color: #c0392b; font-weight: 600; }
  pre { white-space: pre-wrap; font-size: 10px; background: #f7f8fb; border-radius: 8px; padding: 10px; color: #555; max-height: 300px; overflow: hidden; }
</style></head><body>

<h1>📊 Relatório Semanal — Pindorama Prospecção</h1>
<div class="sub">Gerado em ${today.toLocaleDateString('pt-BR')} · Período ${wkStart.toLocaleDateString('pt-BR')} a ${today.toLocaleDateString('pt-BR')}</div>

<h2>Números gerais</h2>
<div class="cards">
  <div class="card"><div class="n">${all.length}</div><div class="l">Leads cadastrados</div></div>
  <div class="card"><div class="n">${e1.length}</div><div class="l">Email1 enviados</div></div>
  <div class="card"><div class="n">${e2.length}</div><div class="l">Email2 (follow-up)</div></div>
  <div class="card"><div class="n">${e3.length}</div><div class="l">Email3 (último contato)</div></div>
  <div class="card"><div class="n">${e1.length + e2.length + e3.length}</div><div class="l">Total envios</div></div>
  <div class="card"><div class="n">${responses.length}</div><div class="l">Respostas (${rate}%)</div></div>
</div>

<h2>Status operacional</h2>
<div class="grid">
  <div class="panel">
    <div class="row"><span>Pendentes p/ email1</span><span>${pending}</span></div>
    <div class="row"><span>Planilha processada</span><span>${planProc}/${plan.length || '-'}</span></div>
    <div class="row"><span>WhatsApp total</span><span>${waTotal}</span></div>
    <div class="row"><span>WhatsApp hoje</span><span>${waToday}/4</span></div>
    <div class="row"><span>Limite Gmail</span><span>~500/24h (janela deslizante)</span></div>
  </div>
  <div class="panel">
    <div class="seg-nome">Segmentos (enviados/total)</div>
    ${segHtml}
  </div>
</div>

<h2>Atividade dos últimos 7 dias</h2>
<div class="days">${dailyHtml}</div>

<h2>Respostas</h2>
<ul>${respHtml}</ul>

<h2>Resumo do que foi feito</h2>
<pre>${weeklyNotes}</pre>

<div class="foot">Pindorama — Cachaça Artesanal · Relatório automático semanal · gerado por weekly-report.mjs</div>
</body></html>`;

if (!existsSync('reports')) mkdirSync('reports');
writeFileSync('reports/relatorio.html', html);
const outPdf = `reports/relatorio-${todayStr}.pdf`;
const absOut = join(process.cwd(), outPdf);
if (existsSync(absOut)) { try { execSync(isWin ? `del "${absOut}"` : `rm -f "${absOut}"`); } catch {} }

function tryPrint(profileDir, chrome) {
  const args = [
    '--headless', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    `--print-to-pdf=${absOut}`,
    '--print-to-pdf-no-header',
    `file:///` + process.cwd().replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/') + `/reports/relatorio.html`
  ];
  try { execFileSync(chrome, args, { timeout: 20000 }); return true; } catch (e) { return false; }
}

// Chrome imprime o PDF mas as vezes nao sai; testa com perfil novo ate o arquivo nascer
const chromeBin = CHROME_CANDIDATES.find(c => existsSync(c));
if (!chromeBin) { console.error('Chrome nao encontrado (CI sem browser). Enviando apenas HTML.'); }
for (let attempt = 0; attempt < 3 && !existsSync(absOut); attempt++) {
  await killChrome();
  const tmpProfile = 'C:\\Users\\rotat\\AppData\\Local\\Temp\\opencode\\chrome-pdf-' + Date.now() + '-' + attempt;
  tryPrint(tmpProfile, chromeBin);
  await killChrome();
}
if (existsSync(absOut)) console.log('PDF gerado: ' + outPdf);
else console.error('FALHA ao gerar PDF.');
