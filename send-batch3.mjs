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

const templates = {
  consultivo: (lead) => ({
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
  }),
  prova_social: (lead) => ({
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
  }),
  pergunta: (lead) => ({
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
  })
};

const newLeads = [
  { name: 'Fitó Pinheiros', email: 'contato@grupofito.com.br', context: 'cozinha brasileira autoral com coquetelaria própria', template: 'consultivo' },
  { name: 'Bar Martina', email: 'contato@grupo-ftr.com', context: 'drinks autorais em Pinheiros', template: 'pergunta' },
  { name: 'Bernardino Restaurante', email: 'contato@bernardinorestaurante.com.br', context: 'gastronomia tradicional no Campo Belo', template: 'prova_social' },
  { name: 'Taco Bar e Cozinha Mexicana', email: 'tacosp@tacosp.com.br', context: 'referência em drinks mexicanos em SP', template: 'consultivo' },
  { name: 'GoPub Brooklin', email: 'mauro@gopub.com.br', context: 'pub com chopp artesanal no Brooklin', template: 'pergunta' },
  { name: 'Adega Brooklin', email: 'contato@adegabrooklin.com.br', context: 'adega mais gente boa de São Paulo', template: 'consultivo' },
  { name: 'Brooklin Vinhos', email: 'comercial@brooklynvinhos.com.br', context: 'loja de vinhos no Brooklin Paulista', template: 'prova_social' },
  { name: 'EAP Empório Alto dos Pinheiros', email: 'contato@eapsp.com.br', context: 'empório com mais de 750 cervejas', template: 'pergunta' },
  { name: 'Bar Alto', email: 'agenda@baralto.com.br', context: 'bar e restaurante no Alto de Pinheiros', template: 'consultivo' },
];

async function sendAll() {
  for (const lead of newLeads) {
    const tpl = templates[lead.template](lead);
    try {
      await transporter.sendMail({
        from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
        to: lead.email,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
      });
      console.log(`✅ ${lead.name} (${lead.email}) [${lead.template}]`);
    } catch (err) {
      console.error(`❌ ${lead.name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nLote 3 enviado');
}

sendAll();
