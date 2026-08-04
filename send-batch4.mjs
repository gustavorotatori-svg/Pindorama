import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' },
});

const GIF_URL = 'https://iili.io/CkQ8gFR.gif';

const S = `
<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;">
  <p style="margin:0;"><strong>Gustavo</strong></p>
  <p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p>
  <p style="margin:3px 0;">(11) 91357-7900 · drinkpindorama.com</p>
  <img src="${GIF_URL}" alt="Pindorama" style="max-width:280px;height:auto;border-radius:6px;margin-top:15px;" />
</div>`;

const T = {
  consultivo: (l) => ({
    subject: `${l.name} — ideia para carta de drinks`,
    text: `Oi,\n\n${l.context} e tive uma ideia.\n\nTrabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails.\n\nSe quiser, posso sugerir combinações.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ndrinkpindorama.com`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>${l.context} e tive uma ideia.</p><p>Trabalho com cachaça artesanal (Pindorama) e o <strong>Fasano já usa em cocktails</strong>.</p><p>Se quiser, posso sugerir combinações.</p>${S}</div>`,
  }),
  prova_social: (l) => ({
    subject: `Cachaça artesanal para o ${l.name}`,
    text: `Oi,\n\nTrabalho com cachaça artesanal premium e o ${l.name} me pareceu o perfil ideal.\n\nJá fornecemos para Fasano, Hilton, Rosewood.\n\nPosso enviar uma amostra?\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ndrinkpindorama.com`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>Trabalho com cachaça artesanal premium e o <strong>${l.name}</strong> me pareceu o perfil ideal.</p><p>Já fornecemos para <strong>Fasano, Hilton, Rosewood</strong>.</p><p>Posso enviar uma amostra?</p>${S}</div>`,
  }),
  pergunta: (l) => ({
    subject: `Pergunta rápida — ${l.name}`,
    text: `Oi,\n\nPergunta rápida: o ${l.name} trabalha com cachaça artesanal na carta?\n\nSe sim, tenho uma sugestão.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ndrinkpindorama.com`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>Pergunta rápida: o <strong>${l.name}</strong> trabalha com cachaça artesanal na carta?</p><p>Se sim, tenho uma sugestão.</p>${S}</div>`,
  }),
};

const leads = [
  { name: 'GoPub Brooklin', email: 'mauro@gopub.com.br', context: 'pub com chopp artesanal no Brooklin', template: 'pergunta' },
  { name: 'Adega Brooklin', email: 'contato@adegabrooklin.com.br', context: 'adega mais gente boa de São Paulo', template: 'consultivo' },
  { name: 'Brooklin Vinhos', email: 'comercial@brooklynvinhos.com.br', context: 'loja de vinhos no Brooklin Paulista', template: 'prova_social' },
  { name: 'EAP Empório Alto dos Pinheiros', email: 'contato@eapsp.com.br', context: 'empório com mais de 750 cervejas', template: 'pergunta' },
  { name: 'Bar Alto', email: 'agenda@baralto.com.br', context: 'bar e restaurante no Alto de Pinheiros', template: 'consultivo' },
];

for (const l of leads) {
  const e = T[l.template](l);
  try {
    await transporter.sendMail({ from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>', to: l.email, subject: e.subject, text: e.text, html: e.html });
    console.log(`✅ ${l.name}`);
  } catch(err) { console.error(`❌ ${l.name}: ${err.message}`); }
  await new Promise(r => setTimeout(r, 2000));
}

console.log('\nBatch 4 concluído');
