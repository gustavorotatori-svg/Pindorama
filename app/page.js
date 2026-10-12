'use client';

import { useEffect, useState, useMemo } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return null;
    const matchDate = (dateStr) => {
      if (!dateStr) return false;
      if (year !== 'all' && !dateStr.startsWith(year)) return false;
      if (month !== 'all') {
        const y = year === 'all' ? dateStr.slice(0, 4) : year;
        if (!dateStr.startsWith(`${y}-${month}`)) return false;
      }
      return true;
    };
    const leadsFiltered = data.allLeads.filter((l) => matchDate(l.date1) || matchDate(l.date2) || matchDate(l.date3));
    const emails1 = leadsFiltered.filter((l) => l.email1 && matchDate(l.date1)).length;
    const emails2 = leadsFiltered.filter((l) => l.email2 && matchDate(l.date2)).length;
    const emails3 = leadsFiltered.filter((l) => l.email3 && matchDate(l.date3)).length;
    return {
      totalLeads: leadsFiltered.length,
      emails: { email1: emails1, email2: emails2, email3: emails3, total: emails1 + emails2 + emails3 },
      responses: leadsFiltered.filter((l) => l.responded && matchDate(l.responseDate)).length,
      pending: leadsFiltered.filter((l) => !l.email1 && !l.invalidEmail && !l.doNotContact && l.email && l.emailVerified).length,
    };
  }, [data, year, month]);

  if (loading || !data) {
    return (
      <div className="dashboard">
        <div className="header">
          <h1>PINDORAMA</h1>
          <h2>Gustavo</h2>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const maxDaily = Math.max(...data.daily.map((d) => d.count), 1);
  const years = [...new Set(data.daily.map((d) => d.date.slice(0, 4)))].sort();
  const months = [...new Set(data.daily.map((d) => d.date.slice(5, 7)))].sort();

  return (
    <div className="dashboard">
      <div className="header">
        <div className="logo-text">
          <span className="logo-pindorama">PINDORAMA</span>
          <span className="logo-gustavo">Gustavo</span>
        </div>
        <p>Dashboard de Prospecção — Cachaça Artesanal</p>
        <div className="update-time">Atualizado: {new Date(data.lastUpdate).toLocaleString('pt-BR')}</div>
      </div>

      <div className="filters">
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">Todos os anos</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">Todos os meses</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid">
        <div className="card green">
          <div className="card-label">Semana</div>
          <div className="card-value">{data.week.emails.total}</div>
          <div className="card-sub">{data.week.leads} leads · {data.week.responses} respostas</div>
        </div>
        <div className="card blue">
          <div className="card-label">Mês</div>
          <div className="card-value">{data.month.emails.total}</div>
          <div className="card-sub">{data.month.leads} leads · {data.month.responses} respostas</div>
        </div>
        <div className="card purple">
          <div className="card-label">Ano (YTD)</div>
          <div className="card-value">{data.year.emails.total}</div>
          <div className="card-sub">{data.year.leads} leads · {data.year.responses} respostas</div>
        </div>
        <div className="card accent">
          <div className="card-label">Total Leads</div>
          <div className="card-value">{filtered.totalLeads}</div>
          <div className="card-sub">{filtered.emails.total} emails no período</div>
        </div>
        <div className="card orange">
          <div className="card-label">Pendentes</div>
          <div className="card-value">{filtered.pending}</div>
          <div className="card-sub">aguardando envio</div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Envios por Dia (últimos 7 dias)</div>
        <div className="bar-chart">
          {data.daily.slice(-7).map((d, i) => (
            <div key={i} className="bar" style={{ height: `${(d.count / maxDaily) * 100}%` }} title={`${d.date}: ${d.count} envios`}>
              <span className="bar-value">{d.count > 0 ? d.count : ''}</span>
              <span className="bar-label">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Por Segmento</div>
        <table className="table">
          <thead>
            <tr><th>Segmento</th><th>Leads</th><th>Email1</th><th>Responderam</th><th>Taxa</th></tr>
          </thead>
          <tbody>
            {data.segments.slice(0, 12).map((s, i) => (
              <tr key={i}>
                <td><span className="badge badge-blue">{s.name}</span></td>
                <td>{s.total}</td>
                <td>{s.email1}</td>
                <td>{s.responded}</td>
                <td>{s.total > 0 ? ((s.responded / s.total) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section">
        <div className="section-title">Leads Recentes</div>
        <table className="table">
          <thead>
            <tr><th>Nome</th><th>Tipo</th><th>Bairro</th><th>Status</th></tr>
          </thead>
          <tbody>
            {data.recentLeads.slice(0, 10).map((l, i) => (
              <tr key={i}>
                <td>{l.name}</td>
                <td><span className="badge badge-blue">{l.type}</span></td>
                <td>{l.neighborhood || l.city || '—'}</td>
                <td>
                  {l.responded ? <span className="badge badge-green">Respondeu</span> : l.email1 ? <span className="badge badge-orange">Email1 ✓</span> : <span className="badge badge-purple">Pendente</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
