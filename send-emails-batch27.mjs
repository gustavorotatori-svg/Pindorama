import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
});

const pdfPath = join(process.cwd(), 'Apresentacao-Pindorama-2025.pdf');
const pdfBuffer = readFileSync(pdfPath);

const signature = `
---
Gustavo
Pindorama - Cachaça Artesanal
📧 cachaca011pindorama@gmail.com
📞 (11) 91357-7900
🌐 cachaca011pindorama@gmail.com`;

const emailBody = `Olá,

Oi, sou Gustavo da Pindorama, uma cachaça artesanal produzida na Fazenda das Palmas, no Vale do Café, Rio de Janeiro.

Nossa cachaça é única porque nossos canaviais orgânicos são cercados por quase 200 hectares de Mata Atlântica, dentro de uma zona de proteção permanente.

Temos parcerias com hotéis, bares e restaurantes sofisticados como Fasano, Hilton, Rosewood e Emiliano.

Gostaria de oferecer uma amostra gratuita da nossa linha para que vocês conheçam a qualidade Pindorama.

Para envio das amostras, preciso dos seguintes dados cadastrais:
- Razão Social
- CNPJ
- Endereço completo
- Nome para contato

Posso enviar as amostras?

Em anexo segue nossa apresentação institucional.${signature}`;

const leads = [
  { name: 'Empório Alto dos Pinheiros', email: 'contato@eapsp.com.br' },
  { name: 'Pousada Oceano & Mar Ilhabela', email: 'pousadaoceanoemar@gmail.com' },
  { name: 'Pousada Canoa Ilhabela', email: 'reservas@pousadacanoailhabela.com.br' },
  { name: 'Hotel Ilhabela', email: 'reservas@hotelilhabela.com.br' },
  { name: 'Pousada Villa da Prainha', email: 'villadaprainha@gmail.com' },
];

async function sendAll() {
  for (const lead of leads) {
    try {
      await transporter.sendMail({
        from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
        to: lead.email,
        subject: `Pindorama - Oportunidade de Amostra para ${lead.name}`,
        text: emailBody,
        attachments: [
          {
            filename: 'Apresentacao-Pindorama-2025.pdf',
            content: pdfBuffer,
          },
        ],
      });
      console.log(`✅ ${lead.name} (${lead.email})`);
    } catch (error) {
      console.error(`❌ ${lead.name}: ${error.message}`);
    }
  }
}

sendAll();
