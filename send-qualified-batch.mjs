import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
});

const GIF_URL = 'https://iili.io/CkQ8gFR.gif';

const remaining = [
  { name: 'Fogo de Chão Moema', email: 'moema@fogodechao.com.br', context: 'o Fogo de Chão Moema é a primeira unidade da rede em SP', template: 'pergunta' },
  { name: 'Adega Santiago', email: 'contato@adegasantiago.com.br', context: 'a Adega Santiago é referência em vinhos e gastronomia', template: 'consultivo' },
  { name: 'The Graus Bar', email: 'reserva@thegrausbar.com.br', context: 'o The Graus Bar tem uma carta de drinks muito criativa', template: 'prova_social' },
  { name: 'Gero Itaim', email: 'gero.itaim@fasano.com.br', context: 'o Gero Itaim é um dos restaurantes mais prestigiados de SP', template: 'consultivo' },
  { name: 'Ryo Gastronomia', email: 'contato@ryogastronomia.com.br', context: 'o Ryo é conhecido pela alta gastronomia no Itaim', template: 'pergunta' },
];

function makeEmail(lead) {
  if (lead.template === 'consultivo') {
    return {
      subject: `${lead.name} — ideia para carta de drinks`,
      text: `Oi,

${lead.context} e tive uma ideia para a carta de drinks de vocês.

Trabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails. Acho que combinaria muito com o perfil do ${lead.name}.

Se quiser, posso sugerir algumas combinações que funcionam bem — sem compromisso.

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
drinkpindorama.com`,
      html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi,</p>
  <p>${lead.context} e tive uma ideia para a carta de drinks de vocês.</p>
  <p>Trabalho com cachaça artesanal (Pindorama) e o <strong>Fasano já usa em cocktails</strong>. Acho que combinaria muito com o perfil do ${lead.name}.</p>
  <p>Se quiser, posso sugerir algumas combinações que funcionam bem — sem compromisso.</p>
  <div style="margin-top: 25px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 13px; color: #555;">
    <p style="margin: 0;"><strong>Gustavo</strong></p>
    <p style="margin: 3px 0;">Pindorama — Cachaça Artesanal</p>
    <p style="margin: 3px 0;">(11) 91357-7900 · drinkpindorama.com</p>
    <img src="${GIF_URL}" alt="Pindorama" style="max-width: 280px; height: auto; border-radius: 6px; margin-top: 15px;" />
  </div>
</div>`,
    };
  }
  
  if (lead.template === 'prova_social') {
    return {
      subject: `Cachaça artesanal para o ${lead.name}`,
      text: `Oi,

Trabalho com cachaça artesanal premium e o ${lead.name} me pareceu o perfil ideal.

Já fornecemos para hotéis e restaurantes como Fasano, Hilton, Rosewood — e estou expandindo para bares selecionados em SP.

Posso enviar uma amostra para vocês experimentarem?

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
drinkpindorama.com`,
      html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi,</p>
  <p>Trabalho com cachaça artesanal premium e o <strong>${lead.name}</strong> me pareceu o perfil ideal.</p>
  <p>Já fornecemos para hotéis e restaurantes como <strong>Fasano, Hilton, Rosewood</strong> — e estou expandindo para bares selecionados em SP.</p>
  <p>Posso enviar uma amostra para vocês experimentarem?</p>
  <div style="margin-top: 25px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 13px; color: #555;">
    <p style="margin: 0;"><strong>Gustavo</strong></p>
    <p style="margin: 3px 0;">Pindorama — Cachaça Artesanal</p>
    <p style="margin: 3px 0;">(11) 91357-7900 · drinkpindorama.com</p>
    <img src="${GIF_URL}" alt="Pindorama" style="max-width: 280px; height: auto; border-radius: 6px; margin-top: 15px;" />
  </div>
</div>`,
    };
  }
  
  // pergunta
  return {
    subject: `Pergunta rápida — ${lead.name}`,
    text: `Oi,

Pergunta rápida: o ${lead.name} trabalha com cachaça artesanal na carta?

Se sim, tenho uma sugestão que acho que vai agradar. Se não, sem problemas.

Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
drinkpindorama.com`,
    html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <p>Oi,</p>
  <p>Pergunta rápida: o <strong>${lead.name}</strong> trabalha com cachaça artesanal na carta?</p>
  <p>Se sim, tenho uma sugestão que acho que vai agradar. Se não, sem problemas.</p>
  <div style="margin-top: 25px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 13px; color: #555;">
    <p style="margin: 0;"><strong>Gustavo</strong></p>
    <p style="margin: 3px 0;">Pindorama — Cachaça Artesanal</p>
    <p style="margin: 3px 0;">(11) 91357-7900 · drinkpindorama.com</p>
    <img src="${GIF_URL}" alt="Pindorama" style="max-width: 280px; height: auto; border-radius: 6px; margin-top: 15px;" />
  </div>
</div>`,
  };
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
