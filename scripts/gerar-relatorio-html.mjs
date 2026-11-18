import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const data = JSON.parse(readFileSync(join(ROOT, 'dashboard-data.json'), 'utf8'));

const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate = (d) => d ? `${d.slice(8,10)}/${d.slice(5,7)}/${d.slice(0,4)}` : '—';
const fmtMonth = (m) => {
  const [y, mm] = String(m||'').split('-');
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return mm ? `${names[Number(mm)-1]||mm}/${y}` : m;
};
const pct = (n, d) => d > 0 ? ((n / d) * 100).toFixed(2).replace('.', ',') + '%' : '0%';
const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const since = data.sinceBeginning || { leads: data.totalLeads, emails: data.emails, responses: data.responses, whatsapp: data.whatsapp?.total || 0, firstDate: data.sinceDate };

const segmentos = (data.segments || []).slice(0, 15).map(s => `
  <tr>
    <td><span class="badge">${esc(s.name)}</span></td>
    <td>${s.total}</td>
    <td>${s.email1}</td>
    <td>${s.responded}</td>
    <td>${pct(s.responded, s.email1 || s.total)}</td>
  </tr>`).join('');

const monthlyRows = (data.monthly || []).map(m => `
  <tr>
    <td><b>${fmtMonth(m.month)}</b></td>
    <td>${m.email1}</td>
    <td>${m.email2}</td>
    <td>${m.email3}</td>
    <td><b>${m.total}</b></td>
  </tr>`).join('');

const dailyArr = data.daily || [];
const maxDaily = Math.max(...dailyArr.map(d => d.count), 1);
const dias = dailyArr.slice(-14).map(day => {
  const h = Math.max(4, Math.round((day.count / maxDaily) * 100));
  return `
    <div class="day">
      <div class="day-value">${day.count}</div>
      <div class="day-bar-wrap"><div class="bar-fill" style="height:${h}%"></div></div>
      <div class="day-label">${day.date.slice(8,10)}/${day.date.slice(5,7)}</div>
    </div>`;
}).join('');

const recentes = (data.recentLeads || []).map(l => {
  const status = l.responded
    ? '<span class="badge badge-green">Respondeu</span>'
    : l.email1
      ? '<span class="badge badge-orange">Email1 enviado</span>'
      : '<span class="badge badge-purple">Pendente</span>';
  return `
    <tr>
      <td>${esc(l.name)}</td>
      <td><span class="badge">${esc(l.type || '—')}</span></td>
      <td>${esc(l.neighborhood || l.city || '—')}</td>
      <td>${fmtDate(l.date1)}</td>
      <td>${status}</td>
    </tr>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="300">
<title>Pindorama — Relatório de Prospecção (desde o início)</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #f5f7fa; padding: 24px; line-height: 1.5; }
  .container { max-width: 1200px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  h1 { font-size: 28px; color: #1a1a2e; }
  .sub { color: #666; font-size: 13px; }
  .atualizado { font-size: 12px; color: #555; background: #fff; padding: 8px 12px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
  .atualizado b { color: #e07b39; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 30px; }
  .card { background: #fff; border-radius: 12px; padding: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-top: 4px solid #f0c040; }
  .card.green { border-top-color: #27ae60; }
  .card.blue { border-top-color: #2f6fed; }
  .card.purple { border-top-color: #8e44ad; }
  .card.orange { border-top-color: #e67e22; }
  .card.accent { border-top-color: #f39c12; }
  .card.red { border-top-color: #c0392b; }
  .card .n { font-size: 32px; font-weight: 800; color: #1a1a2e; }
  .card .l { font-size: 12px; color: #666; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card .s { font-size: 13px; color: #888; margin-top: 4px; }
  h2 { font-size: 18px; color: #e07b39; margin: 28px 0 12px; border-bottom: 2px solid #f0c040; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 30px; }
  th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #eef1f6; }
  th { background: #f8f9fb; font-weight: 700; color: #3a3f50; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fef9e7; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .badge-green { background: #d4edda; color: #155724; }
  .badge-orange { background: #ffeeba; color: #856404; }
  .badge-purple { background: #e2d9f3; color: #5a3a9a; }
  .bar-chart { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 30px; }
  .chart-title { font-size: 13px; font-weight: 700; color: #3a3f50; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.4px; }
  .days { display: flex; gap: 6px; align-items: flex-end; height: 140px; margin-top: 12px; }
  .day { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; height: 100%; }
  .day-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
  .bar-fill { background: linear-gradient(180deg, #f0c040, #e07b39); width: 100%; border-radius: 4px 4px 0 0; min-height: 2px; }
  .day-label { font-size: 10px; color: #777; margin-top: 4px; }
  .day-value { font-size: 11px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .info { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 30px; }
  .info h3 { font-size: 15px; color: #1a1a2e; margin-bottom: 12px; }
  .info p { margin: 6px 0; color: #4a5568; font-size: 14px; }
  .info b { color: #e07b39; }
  .highlight { background: #fff9e8; border: 1px solid #f0c040; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 14px; color: #4a5568; }
  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eef1f6; color: #888; font-size: 11px; text-align: center; }
</style>
</head>
<body>
<div class="container">
  <header>
    <div>
      <h1>Pindorama — Relatório de Prospecção</h1>
      <div class="sub">Cachaça Artesanal Premium · Relatório online com histórico desde o início · link fixo e atualização automática</div>
    </div>
    <div class="atualizado">Atualizado em: <b>${esc(agora)}</b><br><span style="font-size:11px;color:#888">Atualização automática (a cada hora) · página recarrega a cada 5 min</span></div>
  </header>

  <div class="highlight"><b>Período completo:</b> desde <b>${fmtDate(since.firstDate)}</b> até hoje — este relatório consolida todas as informações de prospecção desde o início da operação.</div>

  <h2>Desde o início (${fmtDate(since.firstDate)} → hoje)</h2>
  <div class="cards">
    <div class="card green"><div class="n">${since.leads}</div><div class="l">Total de leads</div><div class="s">Base completa</div></div>
    <div class="card blue"><div class="n">${since.emails.email1}</div><div class="l">Email 1 enviados</div><div class="s">Primeiros contatos</div></div>
    <div class="card purple"><div class="n">${(since.emails.email2||0)+(since.emails.email3||0)}</div><div class="l">Follow-ups (E2+E3)</div><div class="s">E2: ${since.emails.email2||0} · E3: ${since.emails.email3||0}</div></div>
    <div class="card orange"><div class="n">${since.emails.total || (since.emails.email1+(since.emails.email2||0)+(since.emails.email3||0))}</div><div class="l">Total de e-mails</div><div class="s">Todos os envios</div></div>
    <div class="card accent"><div class="n">${since.responses}</div><div class="l">Respostas / interesse</div><div class="s">Taxa: ${pct(since.responses, since.emails.email1)}</div></div>
    <div class="card red"><div class="n">${since.whatsapp || 0}</div><div class="l">WhatsApp aceitos</div><div class="s">Total acumulado</div></div>
  </div>

  <h2>Resumo por período</h2>
  <table>
    <thead><tr><th>Período</th><th>Leads com envio</th><th>Email 1</th><th>Email 2</th><th>Email 3</th><th>Total e-mails</th><th>Respostas</th></tr></thead>
    <tbody>
      <tr><td><b>Semana (7 dias)</b></td><td>${data.week.leads}</td><td>${data.week.emails.email1}</td><td>${data.week.emails.email2}</td><td>${data.week.emails.email3}</td><td>${data.week.emails.total}</td><td>${data.week.emails.responses||0}</td></tr>
      <tr><td><b>Mês atual</b></td><td>${data.month.leads}</td><td>${data.month.emails.email1}</td><td>${data.month.emails.email2}</td><td>${data.month.emails.email3}</td><td>${data.month.emails.total}</td><td>${data.month.emails.responses||0}</td></tr>
      <tr><td><b>Ano (YTD)</b></td><td>${data.year.leads}</td><td>${data.year.emails.email1}</td><td>${data.year.emails.email2}</td><td>${data.year.emails.email3}</td><td>${data.year.emails.total}</td><td>${data.year.emails.responses||0}</td></tr>
      <tr style="background:#fff9e8"><td><b>Desde o início (${fmtDate(since.firstDate)})</b></td><td>${since.leads}</td><td>${since.emails.email1}</td><td>${since.emails.email2||0}</td><td>${since.emails.email3||0}</td><td>${since.emails.total || (since.emails.email1+(since.emails.email2||0)+(since.emails.email3||0))}</td><td>${since.responses}</td></tr>
    </tbody>
  </table>

  <h2>Histórico mensal (desde o início)</h2>
  <table>
    <thead><tr><th>Mês</th><th>Email 1</th><th>Email 2</th><th>Email 3</th><th>Total</th></tr></thead>
    <tbody>${monthlyRows || '<tr><td colspan="5">Sem dados</td></tr>'}</tbody>
  </table>

  <div class="bar-chart">
    <div class="chart-title">Envios por dia (últimos 14 dias)</div>
    <div class="days">${dias || '<div style="color:#888;font-size:13px">Sem envios recentes</div>'}</div>
  </div>

  <h2>Por segmento (Top 15)</h2>
  <table>
    <thead><tr><th>Segmento</th><th>Leads</th><th>Email 1</th><th>Responderam</th><th>Taxa resp. (sobre E1)</th></tr></thead>
    <tbody>${segmentos || '<tr><td colspan="5">—</td></tr>'}</tbody>
  </table>

  <h2>Contatos recentes (últimos envios)</h2>
  <table>
    <thead><tr><th>Nome</th><th>Tipo</th><th>Cidade/Bairro</th><th>Data Email 1</th><th>Status</th></tr></thead>
    <tbody>${recentes || '<tr><td colspan="5">—</td></tr>'}</tbody>
  </table>

  <div class="info">
    <h3>Configuração atual do pipeline</h3>
    <p><b>Foco:</b> prospecção de bares, restaurantes e venues premium/coquetelaria na Grande São Paulo (e-mails corporativos públicos, verificados).</p>
    <p><b>Follow-ups:</b> reativados com cuidado (toques espaçados, limite por execução, interrupção em caso de resposta).</p>
    <p><b>Quota de e-mail:</b> até 100 envios por janela móvel de 24h (com reserva operacional).</p>
    <p><b>Pendentes (email verificado, aguardando envio):</b> ${data.pending}</p>
    <p><b>WhatsApp:</b> total aceitos acumulado ${data.whatsapp?.total || 0} (hoje: ${data.whatsapp?.today || 0}).</p>
  </div>

  <div class="footer">Pindorama — Cachaça Artesanal · Relatório gerado automaticamente · link estável (GitHub Pages) · dados consolidados desde ${fmtDate(since.firstDate)}</div>
</div>
</body>
</html>`;

mkdirSync(join(ROOT, 'relatorio'), { recursive: true });
writeFileSync(join(ROOT, 'relatorio', 'index.html'), html);

// publica também os dados para consulta/auditoria
if (existsSync(join(ROOT, 'dashboard-data.json'))) {
  copyFileSync(join(ROOT, 'dashboard-data.json'), join(ROOT, 'relatorio', 'dashboard-data.json'));
}
console.log('Relatório HTML gerado em relatorio/index.html (desde', since.firstDate, ')');
