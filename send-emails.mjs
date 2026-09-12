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

const target = process.argv[2];

const leads = [
  { name: 'Bar do Juarez', email: 'isabella@bardojuarez.com.br' },
  { name: 'Iulia Itaim', email: 'reserva@iulia.com.br' },
  { name: 'Bar Charles Edward', email: 'marketing@barcharles.com.br' },
  { name: 'Maevva Bar', email: 'contato@maevva.com.br' },
  { name: 'Cervejaria Moemia', email: 'contato@cervejariamoemia.com.br' },
  { name: 'DOPA Bar', email: 'contato@dopabar.com.br' },
  { name: 'Seo Gomes', email: 'info@seogomes.com.br' },
];

async function sendOne(lead) {
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

if (target) {
  const lead = leads.find(l => l.email === target || l.name === target);
  if (lead) {
    await sendOne(lead);
  } else {
    console.error('Lead não encontrado');
  }
} else {
  for (const lead of leads) {
    await sendOne(lead);
  }
}
