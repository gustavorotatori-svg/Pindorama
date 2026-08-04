import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { sendEmail, getEmail1Content, getEmail2Content, getEmail3Content } from '@/lib/email';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const { prospectId, emailNumber } = await request.json();

    // Buscar dados do prospect
    const prospectRef = doc(db, 'prospects', prospectId);
    const prospectSnap = await getDoc(prospectRef);
    
    if (!prospectSnap.exists()) {
      return NextResponse.json({ error: 'Prospect não encontrado' }, { status: 404 });
    }

    const prospect = prospectSnap.data();
    const contactName = prospect.name;
    const email = prospect.email;

    if (!email) {
      return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 });
    }

    // Preparar email baseado no número
    let subject = '';
    let html = '';
    let newStatus = '';
    let nextEmailDate = null;

    switch (emailNumber) {
      case 1:
        subject = `Pindorama - Oportunidade de Amostra para ${contactName}`;
        html = getEmail1Content(contactName, contactName);
        newStatus = 'email1';
        // Email 2 em 2 dias (dia 3)
        nextEmailDate = new Date();
        nextEmailDate.setDate(nextEmailDate.getDate() + 2);
        break;
      case 2:
        subject = `Re: Pindorama - Amostra para ${contactName}`;
        html = getEmail2Content(contactName);
        newStatus = 'email2';
        // Email 3 em 2 dias (dia 5)
        nextEmailDate = new Date();
        nextEmailDate.setDate(nextEmailDate.getDate() + 2);
        break;
      case 3:
        subject = `Última oportunidade - Amostra Pindorama`;
        html = getEmail3Content(contactName);
        newStatus = 'email3';
        // Sem próximo email
        break;
      default:
        return NextResponse.json({ error: 'Número de email inválido' }, { status: 400 });
    }

    // Ler PDF da apresentação
    const pdfPath = join(process.cwd(), 'public', 'apresentacao-pindorama.pdf');
    const pdfBuffer = readFileSync(pdfPath);

    // Enviar email com anexo
    const result = await sendEmail({
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: 'Apresentacao-Pindorama-2025.pdf',
          content: pdfBuffer,
        },
      ],
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 });
    }

    // Atualizar status do prospect
    await updateDoc(prospectRef, {
      status: newStatus,
      updatedAt: new Date(),
      nextAction: nextEmailDate,
    });

    // Registrar interação
    await addDoc(collection(db, 'interactions'), {
      prospectId,
      type: 'email',
      subject,
      content: html,
      sentAt: new Date(),
      status: 'sent',
      emailSequence: emailNumber,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Email ${emailNumber} enviado com sucesso`,
      nextEmailDate 
    });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
