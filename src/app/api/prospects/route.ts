import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Prospect } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let q = query(collection(db, 'prospects'), orderBy('createdAt', 'desc'));

    if (region) {
      q = query(q, where('region', '==', region));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (type) {
      q = query(q, where('type', '==', type));
    }

    const snapshot = await getDocs(q);
    const prospects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Prospect[];

    return NextResponse.json(prospects);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar prospects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const prospectData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'lead',
      qualified: true,
    };

    const docRef = await addDoc(collection(db, 'prospects'), prospectData);
    
    return NextResponse.json({ id: docRef.id, ...prospectData });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar prospect' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    
    const prospectRef = doc(db, 'prospects', id);
    await updateDoc(prospectRef, {
      ...data,
      updatedAt: new Date(),
    });

    return NextResponse.json({ id, ...data });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar prospect' }, { status: 500 });
  }
}
