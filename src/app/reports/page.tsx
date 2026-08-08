'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { Prospect } from '@/types';

export default function Reports() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      const response = await fetch('/api/prospects');
      const data = await response.json();
      setProspects(data);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar por mês selecionado
  const filteredProspects = prospects.filter(p => {
    const date = new Date(p.createdAt);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  // Calcular métricas
  const metrics = {
    total: filteredProspects.length,
    email1: filteredProspects.filter(p => p.status === 'email1').length,
    email2: filteredProspects.filter(p => p.status === 'email2').length,
    email3: filteredProspects.filter(p => p.status === 'email3').length,
    positivo: filteredProspects.filter(p => p.status === 'positivo').length,
    fechado: filteredProspects.filter(p => p.status === 'fechado').length,
  };

  // Métricas por região
  const byRegion = {
    sp_metro: filteredProspects.filter(p => p.region === 'sp_metro').length,
    abcd: filteredProspects.filter(p => p.region === 'abcd').length,
    baixada_santista: filteredProspects.filter(p => p.region === 'baixada_santista').length,
    litoral_norte: filteredProspects.filter(p => p.region === 'litoral_norte').length,
    sorocaba_regiao: filteredProspects.filter(p => p.region === 'sorocaba_regiao').length,
  };

  // Métricas por tipo
  const byType = {
    bar: filteredProspects.filter(p => p.type === 'bar').length,
    restaurante: filteredProspects.filter(p => p.type === 'restaurante').length,
    adega: filteredProspects.filter(p => p.type === 'adega').length,
    hotel: filteredProspects.filter(p => p.type === 'hotel').length,
    souvenir: filteredProspects.filter(p => p.type === 'souvenir').length,
  };

  // Taxa de conversão
  const conversionRate = metrics.total > 0 
    ? ((metrics.positivo + metrics.fechado) / metrics.total * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Relatório Mensal
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Filtros */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total de Leads</p>
            <p className="text-3xl font-bold text-gray-800">{metrics.total}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Email 1 Enviados</p>
            <p className="text-3xl font-bold text-blue-600">{metrics.email1}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Email 2 Enviados</p>
            <p className="text-3xl font-bold text-yellow-600">{metrics.email2}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Email 3 Enviados</p>
            <p className="text-3xl font-bold text-orange-600">{metrics.email3}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Respostas Positivas</p>
            <p className="text-3xl font-bold text-green-600">{metrics.positivo}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Fechados</p>
            <p className="text-3xl font-bold text-purple-600">{metrics.fechado}</p>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Taxa de Conversão</h2>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-green-800">{conversionRate}%</div>
            <p className="text-gray-500">dos leads geraram resposta positiva ou fechamento</p>
          </div>
        </div>

        {/* Métricas por Região */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Por Região</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">São Paulo Metropolitana</span>
                <span className="font-bold">{byRegion.sp_metro}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ABCD</span>
                <span className="font-bold">{byRegion.abcd}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Baixada Santista</span>
                <span className="font-bold">{byRegion.baixada_santista}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Litoral Norte</span>
                <span className="font-bold">{byRegion.litoral_norte}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sorocaba e região</span>
                <span className="font-bold">{byRegion.sorocaba_regiao}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Por Tipo</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bares</span>
                <span className="font-bold">{byType.bar}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Restaurantes</span>
                <span className="font-bold">{byType.restaurante}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Adegas</span>
                <span className="font-bold">{byType.adega}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Hotéis</span>
                <span className="font-bold">{byType.hotel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Souvenirs</span>
                <span className="font-bold">{byType.souvenir}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Leads do Mês</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Região</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Avaliação</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((prospect) => (
                  <tr key={prospect.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{prospect.name}</td>
                    <td className="py-3 px-4 text-gray-600">{prospect.type}</td>
                    <td className="py-3 px-4 text-gray-600">{prospect.region}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prospect.status === 'fechado' ? 'bg-green-100 text-green-800' :
                        prospect.status === 'positivo' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {prospect.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-yellow-500">★</span> {prospect.googleRating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
