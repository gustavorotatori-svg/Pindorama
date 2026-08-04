import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
});

const GIF_URL = 'https://iili.io/CkQ8gFR.gif';

const remaining = [
  { name: 'Ristorantino Jardins', email: 'contato@ristorantino.com.br', contact: 'Equipe Ristorantino' },
  { name: 'Miró Gastronomia', email: 'reservas@mirogastronomia.com.br', contact: 'Equipe Miró' },
  { name: 'WZ Hotel Jardins', email: 'reservas@wzhoteljardins.com.br', contact: 'Equipe WZ Hotel' },
  { name: 'Hotel Trianon Paulista', email: 'reservas@hoteltrianon.com.br', contact: 'Equipe Trianon' },
  { name: 'Meliá Jardim Europa', email: 'melia.jardim.europa@solmelia.com', contact: 'Equipe Meliá' },
  { name: 'Adega Bianchi', email: 'comercial.adegabianchi@gmail.com', contact: 'Equipe Bianchi' },
];

function makeEmail(lead) {
  const text = `Oi ${lead.contact},

Enviei uma mensagem há alguns dias sobre cachaça artesanal para o ${lead.name}.

Se não chegou, posso reenviar. Se chegou e não faz sentido, sem problemas — só queria garantir.

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
drinkpindorama.com`;

  const html = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi ${lead.contact},</p>
  <p>Enviei uma mensagem há alguns dias sobre cachaça artesanal para o <strong>${lead.name}</strong>.</p>
  <p>Se não chegou, posso reenviar. Se chegou e não faz sentido, sem problemas — só queria garantir.</p>
  <div style="margin-top: 25px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 13px; color: #555;">
    <p style="margin: 0;"><strong>Gustavo</strong></p>
    <p style="margin: 3px 0;">Pindorama — Cachaça Artesanal</p>
    <p style="margin: 3px 0;">(11) 91357-7900 · drinkpindorama.com</p>
    <div style="margin-top: 15px;">
      <img src="${GIF_URL}" alt="Pindorama" style="max-width: 280px; height: auto; border-radius: 6px;" />
    </div>
  </div>
</div>`;

  return { subject: `Re: ${lead.name} — cachaça artesanal`, text, html };
}

async function sendAll() {
  for (const lead of remaining) {
    const email = makeEmail(lead);
    try {
      await transporter.sendMail({
        from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
        to: lead.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      console.log(`✅ ${lead.name} (${lead.email})`);
    } catch (err) {
      console.error(`❌ ${lead.name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

sendAll();
