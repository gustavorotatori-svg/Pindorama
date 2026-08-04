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

const GIF_URL = 'https://iili.io/CkQ8gFR.gif';

const emailHtml = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <p>Olá,</p>
  <p>Oi, sou Gustavo da Pindorama, uma cachaça artesanal produzida na Fazenda das Palmas, no Vale do Café, Rio de Janeiro.</p>
  <p>Nossa cachaça é única porque nossos canaviais orgânicos são cercados por quase 200 hectares de Mata Atlântica, dentro de uma zona de proteção permanente.</p>
  <p>Temos parcerias com hotéis, bares e restaurantes sofisticados como Fasano, Hilton, Rosewood e Emiliano.</p>
  <p>Gostaria de oferecer uma amostra gratuita da nossa linha para que vocês conheçam a qualidade Pindorama.</p>
  <p>Para envio das amostras, preciso dos seguintes dados cadastrais:</p>
  <ul>
    <li>Razão Social</li>
    <li>CNPJ</li>
    <li>Endereço completo</li>
    <li>Nome para contato</li>
  </ul>
  <p>Posso enviar as amostras?</p>
  <p>Em anexo segue nossa apresentação institucional.</p>
  
  <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px;">
    <p style="margin: 0;"><strong>Gustavo</strong></p>
    <p style="margin: 5px 0;">Pindorama - Cachaça Artesanal</p>
    <p style="margin: 5px 0;">📧 cachaca011pindorama@gmail.com</p>
    <p style="margin: 5px 0;">📞 (11) 91357-7900</p>
    <p style="margin: 5px 0;">🌐 drinkpindorama.com</p>
    
    <div style="margin-top: 20px; text-align: center;">
      <img src="${GIF_URL}" alt="Pindorama Cachaça Artesanal" style="max-width: 300px; height: auto; border-radius: 8px;" />
    </div>
  </div>
</div>
`;

const emailText = `Olá,

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

Em anexo segue nossa apresentação institucional.

---
Gustavo
Pindorama - Cachaça Artesanal
📧 cachaca011pindorama@gmail.com
📞 (11) 91357-7900
🌐 drinkpindorama.com

https://iili.io/CkQ8gFR.gif`;

const leads = [
  { name: 'Blue Tree Premium Faria Lima', email: 'reservas.farialima@bluetree.com.br' },
  { name: 'EZ Moema Hotel', email: 'reservas.ezmoema@ezhoteis.com.br' },
  { name: 'Slaviero Hotel Moema', email: 'reservas.sesm@slavierohoteis.com.br' },
  { name: 'Agnello Grill Brooklin', email: 'contato@agnellogrill.com.br' },
];

async function sendAll() {
  for (const lead of leads) {
    try {
      await transporter.sendMail({
        from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
        to: lead.email,
        subject: `Pindorama - Oportunidade de Amostra para ${lead.name}`,
        text: emailText,
        html: emailHtml,
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
