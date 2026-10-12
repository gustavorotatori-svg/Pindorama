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
      if (month !== 'all' && !dateStr.startsWith(`${year === 'all' ? dateStr.slice(0, 4) : year}-${month}`)) return false;
      return true;
    };

    const leadsFiltered = data.allLeads.filter((l) => matchDate(l.date1) || matchDate(l.date2) || matchDate(l.date3));

    return {
      ...data,
      totalLeads: leadsFiltered.length,
      emails: {
        email1: leadsFiltered.filter((l) => l.email1 && matchDate(l.date1)).length,
        email2: leadsFiltered.filter((l) => l.email2 && matchDate(l.date2)).length,
        email3: leadsFiltered.filter((l) => l.email3 && matchDate(l.date3)).length,
        total: leadsFiltered.filter((l) => l.email1 && matchDate(l.date1)).length + leadsFiltered.filter((l) => l.email2 && matchDate(l.date2)).length + leadsFiltered.filter((l) => l.email3 && matchDate(l.date3)).length,
      },
      responses: leadsFiltered.filter((l) => l.responded && matchDate(l.responseDate)).length,
      pending: leadsFiltered.filter((l) => !l.email1 && !l.invalidEmail && !l.doNotContact && l.email && l.emailVerified).length,
      whatsapp: {
        total: data.whatsapp.total,
        today: data.whatsapp.today,
      },
    };
  }, [data, year, month]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="header">
          <img src="/logo.svg" alt="Pindorama" style={{ width: '320px', height: 'auto', marginBottom: '16px' }} />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data || !filtered) {
    return (
      <div className="dashboard">
        <div className="header">
          <img src="/logo.svg" alt="Pindorama" style={{ width: '320px', height: 'auto', marginBottom: '16px' }} />
          <p>Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  const maxDaily = Math.max(...data.daily.map((d) => d.count), 1);
  const funnelMax = Math.max(filtered.totalLeads, 1);
  const years = [...new Set(data.daily.map((d) => d.date.slice(0, 4)))].sort();
  const months = [...new Set(data.daily.map((d) => d.date.slice(5, 7)))].sort();

  return (
    <div className="dashboard">
      <div className="header">
        <img src="/logo.svg" alt="Pindorama" style={{ width: '340px', height: 'auto', marginBottom: '16px' }} />
        <p>Dashboard de Prospecção — Cachaça Artesanal</p>
        <div className="update-time">
          Atualizado: {new Date(data.lastUpdate).toLocaleString('pt-BR')}
        </div>
      </div>

      <div className="filters">
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">Todos os anos</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">Todos os meses</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="grid">
        <div className="card accent">
          <div className="card-label">Total Leads</div>
          <div className="card-value">{filtered.totalLeads}</div>
          <div className="card-sub">no período</div>
        </div>
        <div className="card green">
          <div className="card-label">Emails Enviados</div>
          <div className="card-value">{filtered.emails.total}</div>
          <div className="card-sub">
            {filtered.emails.email1} email1 · {filtered.emails.email2} email2 · {filtered.emails.email3} email3
          </div>
        </div>
        <div className="card blue">
          <div className="card-label">WhatsApp</div>
          <div className="card-value">{filtered.whatsapp.total}</div>
          <div className="card-sub">{filtered.whatsapp.today} hoje</div>
        </div>
        <div className="card purple">
          <div className="card-label">Respostas</div>
          <div className="card-value">{filtered.responses}</div>
          <div className="card-sub">{filtered.totalLeads > 0 ? ((filtered.responses / filtered.totalLeads) * 100).toFixed(1) : 0}% taxa</div>
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
          {data.daily.map((d, i) => (
            <div
              key={i}
              className="bar"
              style={{ height: `${(d.count / maxDaily) * 100}%` }}
              title={`${d.date}: ${d.count} envios`}
            >
              <span className="bar-value">{d.count > 0 ? d.count : ''}</span>
              <span className="bar-label">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Funil de Conversão</div>
        <div className="funnel">
          <div className="funnel-step">
            <span className="funnel-label">Leads</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(filtered.totalLeads / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
              }}
            >
              {filtered.totalLeads}
            </div>
          </div>
          <div className="funnel-step">
            <span className="funnel-label">Email1</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(filtered.emails.email1 / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #4ade80, #22c55e)',
              }}
            >
              {filtered.emails.email1}
            </div>
          </div>
          <div className="funnel-step">
            <span className="funnel-label">Email2</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(filtered.emails.email2 / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)',
              }}
            >
              {filtered.emails.email2}
            </div>
          </div>
          <div className="funnel-step">
            <span className="funnel-label">Email3</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(filtered.emails.email3 / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #fb923c, #f97316)',
              }}
            >
              {filtered.emails.email3}
            </div>
          </div>
          <div className="funnel-step">
            <span className="funnel-label">Responderam</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(filtered.responses / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #d4a574, #f0d0a0)',
              }}
            >
              {filtered.responses}
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Top Bairros</div>
        <div className="grid">
          {data.topNeighborhoods.slice(0, 8).map((n, i) => (
            <div key={i} className="card">
              <div className="card-label">{n.name}</div>
              <div className="card-value">{n.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Leads Recentes</div>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Bairro</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recentLeads.slice(0, 10).map((l, i) => (
              <tr key={i}>
                <td>{l.name}</td>
                <td>
                  <span className="badge badge-blue">{l.type}</span>
                </td>
                <td>{l.neighborhood || l.city || '—'}</td>
                <td>
                  {l.responded ? (
                    <span className="badge badge-green">Respondeu</span>
                  ) : l.email1 ? (
                    <span className="badge badge-orange">Email1 ✓</span>
                  ) : (
                    <span className="badge badge-purple">Pendente</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
