'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="header">
          <h1>Pindorama</h1>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard">
        <div className="header">
          <h1>Pindorama</h1>
          <p>Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  const maxDaily = Math.max(...data.daily.map((d) => d.count), 1);
  const funnelMax = Math.max(data.funnel.leads, 1);

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Pindorama</h1>
        <p>Dashboard de Prospecção — Cachaça Artesanal</p>
        <div className="update-time">
          Atualizado: {new Date(data.lastUpdate).toLocaleString('pt-BR')}
        </div>
      </div>

      <div className="grid">
        <div className="card accent">
          <div className="card-label">Total Leads</div>
          <div className="card-value">{data.totalLeads}</div>
          <div className="card-sub">cadastrados</div>
        </div>
        <div className="card green">
          <div className="card-label">Emails Enviados</div>
          <div className="card-value">{data.emails.total}</div>
          <div className="card-sub">
            {data.emails.email1} email1 · {data.emails.email2} email2 · {data.emails.email3} email3
          </div>
        </div>
        <div className="card blue">
          <div className="card-label">WhatsApp</div>
          <div className="card-value">{data.whatsapp.total}</div>
          <div className="card-sub">{data.whatsapp.today} hoje</div>
        </div>
        <div className="card purple">
          <div className="card-label">Respostas</div>
          <div className="card-value">{data.responses}</div>
          <div className="card-sub">{((data.responses / data.totalLeads) * 100).toFixed(1)}% taxa</div>
        </div>
        <div className="card orange">
          <div className="card-label">Pendentes</div>
          <div className="card-value">{data.pending}</div>
          <div className="card-sub">aguardando envio</div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Envios por Dia (últimos 14 dias)</div>
        <div className="bar-chart">
          {data.daily.map((d, i) => (
            <div
              key={i}
              className="bar"
              style={{ height: `${(d.count / maxDaily) * 100}%` }}
              title={`${d.date}: ${d.count} envios`}
            >
              <span className="bar-value">{d.count > 0 ? d.count : ''}</span>
              <span className="bar-label">{d.date.slice(5)}</span>
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
                width: `${(data.funnel.leads / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
              }}
            >
              {data.funnel.leads}
            </div>
          </div>
          <div className="funnel-step">
            <span className="funnel-label">Email1</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(data.funnel.email1 / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #4ade80, #22c55e)',
              }}
            >
              {data.funnel.email1}
            </div>
          </div>
          <div className="funnel-step">
            <span className="funnel-label">Email2</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(data.funnel.email2 / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)',
              }}
            >
              {data.funnel.email2}
            </div>
          </div>
          <div className="funnel-step">
            <span className="funnel-label">Email3</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(data.funnel.email3 / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #fb923c, #f97316)',
              }}
            >
              {data.funnel.email3}
            </div>
          </div>
          <div className="funnel-step">
            <span className="funnel-label">Responderam</span>
            <div
              className="funnel-bar"
              style={{
                width: `${(data.funnel.responded / funnelMax) * 100}%`,
                background: 'linear-gradient(90deg, #d4a574, #f0d0a0)',
              }}
            >
              {data.funnel.responded}
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
