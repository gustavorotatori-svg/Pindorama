/**
 * RELATÓRIO SEMANAL PDF — Pindorama (toda quinta)
 * Uso: node weekly-report.mjs
 * Gera: reports/relatorio-YYYY-MM-DD.pdf (dashboard + resumo da semana)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
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
const wkStart = new Date(); wkStart.setDate(wkStart.getDate() - 6); wkStart.setHours(0, 0, 0, 0);
const wkStartStr = wkStart.toLocaleDateString('en-CA');
const yearStartStr = `${today.getFullYear()}-01-01`;
const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const inWeek = d => d && d >= wkStartStr && d <= todayStr;
const inYtd = d => d && d >= yearStartStr && d <= todayStr;

const e1 = all.filter(x => x.email1);
const e2 = all.filter(x => x.email2);
const e3 = all.filter(x => x.email3);
const responses = all.filter(x => x.response);
const rate = e1.length ? ((responses.length / e1.length) * 100).toFixed(2) : '0.00';

// Métricas da semana
const weekNewLeads = qualified.filter(x => x.email1 && inWeek(x.date1)).length;
const weekE1 = qualified.filter(x => x.email1 && inWeek(x.date1)).length;
const weekE2 = qualified.filter(x => x.email2 && inWeek(x.date2)).length;
const weekE3 = qualified.filter(x => x.email3 && inWeek(x.date3)).length;
const weekWa = qualified.filter(x => x.whatsappSent && inWeek(x.whatsappDate)).length;
const weekResponses = all.filter(x => x.response && inWeek(x.responseDate));

// Acumulado no ano (YTD)
const ytdE1 = all.filter(x => x.email1 && inYtd(x.date1)).length;
const ytdE2 = all.filter(x => x.email2 && inYtd(x.date2)).length;
const ytdE3 = all.filter(x => x.email3 && inYtd(x.date3)).length;
const ytdWa = qualified.filter(x => x.whatsappSent && inYtd(x.whatsappDate)).length;
const ytdResponses = all.filter(x => x.response && inYtd(x.responseDate));
const ytdRate = ytdE1 ? ((ytdResponses.length / ytdE1) * 100).toFixed(2) : '0.00';
const weekOutputs = weekE1 + weekE2 + weekE3;
const ytdOutputs = ytdE1 + ytdE2 + ytdE3;

// Últimos 7 dias (diário)
const daily = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date(); d.setDate(d.getDate() - i);
  const s = d.toLocaleDateString('en-CA');
  const dd = new Date(d);
  const label = days[dd.getDay()] + ' ' + dd.getDate() + '/' + (dd.getMonth() + 1);
  const enviados = all.filter(x => (x.email1 && x.date1 === s) || (x.email2 && x.date2 === s) || (x.email3 && x.date3 === s)).length;
  const novos = all.filter(x => x.email1 && x.date1 === s).length;
  const whats = qualified.filter(x => x.whatsappSent && x.whatsappDate === s).length;
  daily.push({ label, enviados, novos, whats });
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
const waToday = qualified.filter(x => x.whatsappSent && x.whatsappDate === todayStr).length;
const plan = load(PLAN_FILE);
const planProc = plan.filter(x => x.processed).length;
const planLeft = plan.filter(x => !x.processed).length;

const weeklySummary = [
  `${weekNewLeads} novos leads foram contatados por email.`,
  `${weekE2 + weekE3} follow-ups foram enviados automaticamente.`,
  `${weekWa} primeiras abordagens foram feitas por WhatsApp.`,
  weekResponses.length
    ? `${weekResponses.length} resposta(s) recebida(s) na semana.`
    : 'Nenhuma nova resposta foi recebida na semana.',
  `${planLeft} contatos da base complementar ainda aguardam processamento.`
];

const segHtml = Object.entries(segs).map(([t, d]) => `
  <div class="seg">
    <div class="seg-nome">${t}</div>
    <div class="seg-num">${d.sent}/${d.total}</div>
    <div class="bar"><div class="bar-fill" style="width:${d.total ? Math.round(d.sent / d.total * 100) : 0}%"></div></div>
  </div>`).join('');

const dailyHtml = daily.map(d => `
  <div class="day">
    <div class="day-label">${d.label}</div>
    <div class="day-total">${d.enviados}</div>
    <div class="day-sub">${d.novos} novos${d.whats ? ' · ' + d.whats + ' WA' : ''}</div>
    <div class="bar"><div class="bar-fill" style="width:${d.enviados ? Math.min(100, d.enviados / 120 * 100) : 0}%"></div></div>
  </div>`).join('');

const respHtml = weekResponses.length
  ? weekResponses.map(r => `<li><b>${r.name}</b> (${r.responseDate}) — ${r.response || r.interestNote || ''}</li>`).join('')
  : '<li>Nenhuma resposta na semana</li>';

const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório Pindorama - 7 dias e YTD - ${todayStr}</title>
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
  .card.week { border-left-color: #27ae60; background: #f0faf3; }
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
  .summary { font-size: 13px; line-height: 1.55; }
  .executive { margin-top: 16px; background: #fff9e8; border: 1px solid #f0c040; border-radius: 10px; padding: 14px 16px; }
  .executive li { margin: 4px 0; }
  .note { font-size: 12px; color: #555; line-height: 1.5; margin: 6px 0 10px; }
  .segments-section { break-before: page; page-break-before: always; }
</style></head><body>

<h1>Relatório de Prospecção - 7 dias e YTD</h1>
<div class="sub">Gerado em ${today.toLocaleDateString('pt-BR')} · Período ${wkStart.toLocaleDateString('pt-BR')} a ${today.toLocaleDateString('pt-BR')}</div>

<h2>Executive Summary</h2>
<div class="executive"><ul>
  <li><b>Últimos 7 dias:</b> ${weekOutputs} saídas de email, ${weekWa} abordagens por WhatsApp e ${weekResponses.length} nova(s) resposta(s).</li>
  <li><b>Year to date:</b> ${ytdOutputs} saídas de email para ${ytdE1} primeiros contatos, ${ytdWa} abordagens por WhatsApp e ${ytdResponses.length} resposta(s).</li>
  <li><b>Qualidade e risco:</b> a taxa de resposta YTD é ${ytdRate}%. O teto operacional é 35 saídas por janela móvel de 24h, com prioridade para contatos comerciais verificáveis.</li>
</ul></div>

<h2>Year to date (${today.getFullYear()})</h2>
<div class="cards">
  <div class="card"><div class="n">${all.length}</div><div class="l">Leads cadastrados</div></div>
  <div class="card"><div class="n">${ytdE1}</div><div class="l">Primeiros emails</div></div>
  <div class="card"><div class="n">${ytdE2 + ytdE3}</div><div class="l">Follow-ups</div></div>
  <div class="card"><div class="n">${ytdWa}</div><div class="l">WhatsApp</div></div>
  <div class="card"><div class="n">${ytdResponses.length}</div><div class="l">Respostas (${ytdRate}%)</div></div>
</div>

<h2>Nesta semana (${wkStart.toLocaleDateString('pt-BR')} a ${today.toLocaleDateString('pt-BR')})</h2>
<div class="cards">
  <div class="card week"><div class="n">${weekNewLeads}</div><div class="l">Leads novos</div></div>
  <div class="card week"><div class="n">${weekE1}</div><div class="l">Email1 enviados</div></div>
  <div class="card week"><div class="n">${weekE2}</div><div class="l">Email2 (follow-up)</div></div>
  <div class="card week"><div class="n">${weekE3}</div><div class="l">Email3 (último contato)</div></div>
  <div class="card week"><div class="n">${weekWa}</div><div class="l">WhatsApp enviados</div></div>
  <div class="card week"><div class="n">${weekResponses.length}</div><div class="l">Respostas na semana</div></div>
</div>

<h2>Atividade dos últimos 7 dias</h2>
<p class="note">As barras mostram a distribuição diária de primeiros contatos e follow-ups. Picos devem ser lidos junto ao teto móvel e à qualidade dos destinatários.</p>
<div class="days">${dailyHtml}</div>

<div class="segments-section">
  <h2>Segmentos (enviados/total)</h2>
  <p class="note">A cobertura por segmento orienta a próxima seleção: adegas, lojas e distribuidoras de bebidas, bares e casas noturnas têm prioridade comercial.</p>
  <div class="grid">
    <div class="panel">${segHtml}</div>
  </div>
</div>

<h2>Respostas da semana</h2>
<ul>${respHtml}</ul>

<h2>Status operacional</h2>
<div class="grid">
  <div class="panel">
    <div class="row"><span>Pendentes p/ email1</span><span>${pending}</span></div>
    <div class="row"><span>Planilha processada</span><span>${planProc}/${plan.length || '-'}</span></div>
    <div class="row"><span>Planilha restante</span><span>${planLeft}</span></div>
    <div class="row"><span>WhatsApp hoje</span><span>${waToday}/4</span></div>
    <div class="row"><span>Limite de email</span><span>35/24h (janela móvel)</span></div>
  </div>
</div>

<h2>O que foi feito na semana</h2>
<ul class="summary">${weeklySummary.map(item => `<li>${item}</li>`).join('')}</ul>

<h2>Próximos passos recomendados</h2>
<ul>
  <li>Manter o teto operacional de 35 saídas por janela móvel de 24 horas.</li>
  <li>Revalidar MX antes do primeiro envio e suprimir destinatários com erro permanente.</li>
  <li>Priorizar contatos com site ativo, contexto comercial verificável e domínio corporativo.</li>
  <li>Manter esta automação restrita ao canal de email; nenhum WhatsApp deve ser enviado por ela.</li>
</ul>

<h2>Perguntas em aberto</h2>
<ul><li>Qual é a taxa de entrega efetiva após excluir devoluções? O cadastro registra envios e respostas, mas ainda não consolida todos os bounces como métrica YTD auditável.</li></ul>

<h2>Ressalvas</h2>
<p class="note">Os totais vêm dos campos de status e data dos cadastros do projeto. Leads cadastrados incluem registros sem primeiro envio; respostas dependem da marcação persistida pelo monitor. O YTD cobre 1º de janeiro até a geração, embora a operação tenha começado mais tarde no ano.</p>

<div class="foot">Pindorama — Cachaça Artesanal · Relatório automático semanal · gerado por weekly-report.mjs</div>
</body></html>`;

if (!existsSync('reports')) mkdirSync('reports');
writeFileSync('reports/relatorio.html', html);
const outPdf = `reports/relatorio-${todayStr}.pdf`;
const absOut = join(process.cwd(), outPdf);
if (existsSync(absOut)) { try { execFileSync(isWin ? 'del' : 'rm', [absOut], { shell: true }); } catch {} }

function tryPrint(profileDir, chrome) {
  const args = [
    '--headless', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    `--print-to-pdf=${absOut}`,
    '--no-pdf-header-footer',
    `file:///` + process.cwd().replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/') + `/reports/relatorio.html`
  ];
  try { execFileSync(chrome, args, { timeout: 20000 }); return true; } catch (e) { return false; }
}

const chromeBin = CHROME_CANDIDATES.find(c => existsSync(c));
if (!chromeBin) console.error('Chrome nao encontrado (CI sem browser). Enviando apenas HTML.');
for (let attempt = 0; attempt < 3 && !existsSync(absOut); attempt++) {
  await killChrome();
  const tmpProfile = join(process.env.TEMP || '/tmp', 'chrome-pdf-' + Date.now() + '-' + attempt);
  tryPrint(tmpProfile, chromeBin);
  await killChrome();
}
if (existsSync(absOut)) console.log('PDF gerado: ' + outPdf);
else console.error('FALHA ao gerar PDF.');
