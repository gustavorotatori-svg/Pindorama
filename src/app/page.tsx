'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  ChevronRight,
  BarChart3,
  Users,
  Send,
  CheckCircle
} from 'lucide-react';
import { Prospect } from '@/types';

const statusColumns = [
  { id: 'lead', label: 'Novo Lead', color: 'bg-gray-100' },
  { id: 'email1', label: 'Email 1', color: 'bg-blue-100' },
  { id: 'email2', label: 'Email 2', color: 'bg-yellow-100' },
  { id: 'email3', label: 'Email 3', color: 'bg-orange-100' },
  { id: 'positivo', label: 'Respondeu', color: 'bg-green-100' },
  { id: 'fechado', label: 'Fechado', color: 'bg-purple-100' },
];

export default function Home() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'search'>('pipeline');
  const [searchRegion, setSearchRegion] = useState('sp_metro');
  const [searchType, setSearchType] = useState('bar');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Carregar prospects
  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      const response = await fetch('/api/prospects');
      const data = await response.json();
      setProspects(data);
    } catch (error) {
      console.error('Erro ao carregar prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar no Google Maps
  const searchGoogleMaps = async () => {
    setSearching(true);
    try {
      // Coordenadas baseadas na região
      const coordinates: Record<string, { lat: string; lng: string }> = {
        sp_metro: { lat: '-23.5505', lng: '-46.6333' },
        abcd: { lat: '-23.6737', lng: '-46.5432' },
        baixada_santista: { lat: '-23.9608', lng: '-46.3336' },
        litoral_norte: { lat: '-23.5225', lng: '-45.4181' },
        sorocaba_regiao: { lat: '-23.5015', lng: '-47.4526' },
      };

      const coords = coordinates[searchRegion];
      const response = await fetch(
        `/api/google-maps?lat=${coords.lat}&lng=${coords.lng}&radius=10000&type=${searchType}`
      );
      const data = await response.json();
      setSearchResults(data.prospects || []);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setSearching(false);
    }
  };

  // Adicionar prospect
  const addProspect = async (googleData: any) => {
    try {
      const prospectData = {
        name: googleData.name,
        type: searchType,
        address: googleData.address,
        city: 'São Paulo',
        region: searchRegion,
        phone: googleData.phone,
        email: '', // Precisa ser preenchido manualmente
        website: googleData.website,
        googleRating: googleData.rating,
        googleReviews: googleData.reviews,
      };

      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospectData),
      });

      if (response.ok) {
        loadProspects();
        setSearchResults(searchResults.filter(r => r.googlePlaceId !== googleData.googlePlaceId));
      }
    } catch (error) {
      console.error('Erro ao adicionar:', error);
    }
  };

  // Enviar email
  const sendEmail = async (prospectId: string, emailNumber: number) => {
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, emailNumber }),
      });
      loadProspects();
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  };

  // Mover prospect no pipeline
  const moveProspect = async (prospectId: string, newStatus: string) => {
    try {
      await fetch('/api/prospects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospectId, status: newStatus }),
      });
      loadProspects();
    } catch (error) {
      console.error('Erro ao mover:', error);
    }
  };

  // Filtrar prospects por status
  const getProspectsByStatus = (status: string) => {
    return prospects.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-800 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://drinkpindorama.com/cdn/shop/files/Logo-Pindorama-01.svg?v=1691606646&width=600" 
              alt="Pindorama" 
              className="h-10"
            />
            <h1 className="text-xl font-bold">Prospecção Pindorama</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm opacity-80">Total de Leads</p>
              <p className="text-2xl font-bold">{prospects.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'pipeline'
                ? 'bg-green-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'search'
                ? 'bg-green-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Search className="inline w-4 h-4 mr-2" />
            Buscar no Google Maps
          </button>
        </div>

        {/* Pipeline View */}
        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-6 gap-4 overflow-x-auto">
            {statusColumns.map((column) => (
              <div key={column.id} className={`rounded-lg p-4 ${column.color}`}>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  {column.label}
                  <span className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {getProspectsByStatus(column.id).length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {getProspectsByStatus(column.id).map((prospect) => (
                    <div
                      key={prospect.id}
                      className="kanban-card bg-white rounded-lg p-3 shadow-sm border border-gray-200"
                    >
                      <h4 className="font-medium text-gray-800 text-sm">{prospect.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{prospect.type}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-gray-600">{prospect.googleRating}</span>
                        <span className="text-xs text-gray-400">({prospect.googleReviews})</span>
                      </div>
                      <div className="flex gap-1 mt-3">
                        {column.id === 'lead' && (
                          <button
                            onClick={() => sendEmail(prospect.id, 1)}
                            className="flex-1 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                          >
                            <Send className="inline w-3 h-3 mr-1" />
                            Email 1
                          </button>
                        )}
                        {column.id === 'email1' && (
                          <button
                            onClick={() => sendEmail(prospect.id, 2)}
                            className="flex-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded hover:bg-yellow-600"
                          >
                            <Send className="inline w-3 h-3 mr-1" />
                            Email 2
                          </button>
                        )}
                        {column.id === 'email2' && (
                          <button
                            onClick={() => sendEmail(prospect.id, 3)}
                            className="flex-1 bg-orange-500 text-white text-xs px-2 py-1 rounded hover:bg-orange-600"
                          >
                            <Send className="inline w-3 h-3 mr-1" />
                            Email 3
                          </button>
                        )}
                        {column.id !== 'fechado' && (
                          <button
                            onClick={() => {
                              const nextStatus = statusColumns[
                                statusColumns.findIndex(s => s.id === column.id) + 1
                              ]?.id;
                              if (nextStatus) moveProspect(prospect.id, nextStatus);
                            }}
                            className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-300"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search View */}
        {activeTab === 'search' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Buscar no Google Maps</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Região</label>
                <select
                  value={searchRegion}
                  onChange={(e) => setSearchRegion(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="sp_metro">São Paulo Metropolitana</option>
                  <option value="abcd">ABCD</option>
                  <option value="baixada_santista">Baixada Santista</option>
                  <option value="litoral_norte">Litoral Norte</option>
                  <option value="sorocaba_regiao">Sorocaba e região</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="bar">Bar</option>
                  <option value="restaurante">Restaurante</option>
                  <option value="adega">Adega</option>
                  <option value="loja_bebidas">Loja de Bebidas</option>
                  <option value="souvenir">Loja de Souvenir</option>
                  <option value="hotel">Hotel</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={searchGoogleMaps}
                  disabled={searching}
                  className="w-full bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {searching ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  ) : (
                    <Search className="inline w-4 h-4 mr-2" />
                  )}
                  Buscar
                </button>
              </div>
            </div>

            {/* Resultados */}
            {searchResults.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3">
                  {searchResults.length} resultados encontrados
                </h3>
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div
                      key={result.googlePlaceId}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-medium text-gray-800">{result.name}</h4>
                        <p className="text-sm text-gray-500">{result.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{result.rating}</span>
                          <span className="text-sm text-gray-400">({result.reviews} avaliações)</span>
                          {result.phone && (
                            <span className="text-sm text-gray-400">• {result.phone}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addProspect(result)}
                        className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <Plus className="inline w-4 h-4 mr-1" />
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
