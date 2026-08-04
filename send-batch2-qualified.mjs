import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
});

const GIF_URL = 'https://iili.io/CkQ8gFR.gif';

const SIGNATURE_HTML = `
<div style="margin-top: 25px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 13px; color: #555;">
  <p style="margin: 0;"><strong>Gustavo</strong></p>
  <p style="margin: 3px 0;">Pindorama — Cachaça Artesanal</p>
  <p style="margin: 3px 0;">(11) 91357-7900 · drinkpindorama.com</p>
  <img src="${GIF_URL}" alt="Pindorama" style="max-width: 280px; height: auto; border-radius: 6px; margin-top: 15px;" />
</div>`;

// Novos leads (sem email1)
const newLeads = [
  {
    name: 'Terraço Jardins',
    email: 'terraco.jardins@marriott.com',
    context: 'gastronomia contemporânea no Renaissance Hotel',
    template: 'consultivo'
  },
  {
    name: 'Pullman São Paulo Vila Olímpia',
    email: 'reservas.pullmanvilaolimpia@accor.com',
    context: 'hotel 5 estrelas com HUB Bar no lobby',
    template: 'prova_social'
  },
  {
    name: 'Manifesto Bar',
    email: 'info@manifestobar.com.br',
    context: 'tradicional bar na Vila Olímpia',
    template: 'pergunta'
  },
  {
    name: 'The World Hotels Vila Olímpia',
    email: 'reservas@theworld.com.br',
    context: 'hotel com localização privilegiada na Vila Olímpia',
    template: 'consultivo'
  },
  {
    name: 'Le Jardin - Rosewood',
    email: 'saopaulo.restaurantes@rosewoodhotels.com',
    context: 'grand café no Rosewood Hotel',
    template: 'prova_social'
  },
];

function buildEmail(lead) {
  const cons = {
    subject: `${lead.name} — ideia para carta de drinks`,
    text: `Oi,

${lead.context} e tive uma ideia para a carta de drinks.

Trabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails.

Se quiser, posso sugerir combinações que funcionam bem — sem compromisso.

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
drinkpindorama.com`,
    html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi,</p>
  <p>${lead.context} e tive uma ideia para a carta de drinks.</p>
  <p>Trabalho com cachaça artesanal (Pindorama) e o <strong>Fasano já usa em cocktails</strong>.</p>
  <p>Se quiser, posso sugerir combinações que funcionam bem — sem compromisso.</p>
  ${SIGNATURE_HTML}
</div>`
  };

  const social = {
    subject: `Cachaça artesanal para o ${lead.name}`,
    text: `Oi,

Trabalho com cachaça artesanal premium e o ${lead.name} me pareceu o perfil ideal.

Já fornecemos para hotéis e restaurantes como Fasano, Hilton, Rosewood.

Posso enviar uma amostra para vocês experimentarem?

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
drinkpindorama.com`,
    html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi,</p>
  <p>Trabalho com cachaça artesanal premium e o <strong>${lead.name}</strong> me pareceu o perfil ideal.</p>
  <p>Já fornecemos para hotéis e restaurantes como <strong>Fasano, Hilton, Rosewood</strong>.</p>
  <p>Posso enviar uma amostra para vocês experimentarem?</p>
  ${SIGNATURE_HTML}
</div>`
  };

  const pergunta = {
    subject: `Pergunta rápida — ${lead.name}`,
    text: `Oi,

Pergunta rápida: o ${lead.name} trabalha com cachaça artesanal na carta?

Se sim, tenho uma sugestão que acho que vai agradar.

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
drinkpindorama.com`,
    html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi,</p>
  <p>Pergunta rápida: o <strong>${lead.name}</strong> trabalha com cachaça artesanal na carta?</p>
  <p>Se sim, tenho uma sugestão que acho que vai agradar.</p>
  ${SIGNATURE_HTML}
</div>`
  };

  const templates = { consultivo: cons, prova_social: social, pergunta };
  return templates[lead.template] || pergunta;
}

async function sendAll() {
  for (const lead of newLeads) {
    const email = buildEmail(lead);
    try {
      await transporter.sendMail({
        from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
        to: lead.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      console.log(`✅ ${lead.name} (${lead.email}) [${lead.template}]`);
    } catch (err) {
      console.error(`❌ ${lead.name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✅ Lote enviado');
}

sendAll();
