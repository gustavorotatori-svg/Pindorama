import { NextResponse } from 'next/server';

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  phone_number?: string;
  website?: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5000'; // 5km padrão
    const type = searchParams.get('type'); // bar, restaurant, etc

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Coordenadas obrigatórias' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 });
    }

    // Mapear tipos para Google Places
    const typeMap: Record<string, string> = {
      bar: 'bar',
      restaurante: 'restaurant',
      adega: 'liquor_store',
      loja_bebidas: 'liquor_store',
      souvenir: 'store',
      hotel: 'hotel',
    };

    const placeType = type ? typeMap[type] : '';
    
    // Buscar places
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}${placeType ? `&type=${placeType}` : ''}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ error: 'Erro na busca do Google Maps' }, { status: 500 });
    }

    // Filtrar e formatar resultados
    const places: GooglePlace[] = data.results || [];
    
    const prospects = places
      .filter((place) => {
        // Filtrar por avaliação
        if (place.rating && place.rating < 4.0) return false;
        if (place.user_ratings_total && place.user_ratings_total < 30) return false;
        return true;
      })
      .map((place) => ({
        googlePlaceId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || 0,
        reviews: place.user_ratings_total || 0,
        phone: place.phone_number || '',
        website: place.website || '',
        types: place.types,
        location: place.geometry.location,
      }));

    return NextResponse.json({ prospects });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
