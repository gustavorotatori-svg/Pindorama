import nodemailer from 'nodemailer';

const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' },
});

const GIF = 'https://iili.io/CkQ8gFR.gif';
const S = `<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;"><p style="margin:0;"><strong>Gustavo</strong></p><p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p><p style="margin:3px 0;">(11) 91357-7900 · cachaca011pindorama@gmail.com</p><img src="${GIF}" alt="Pindorama" style="max-width:280px;height:auto;border-radius:6px;margin-top:15px;" /></div>`;

const leads = [
  { name: 'Terraço Jardins', email: 'terracojardins@marriott.com' },
  { name: 'Pullman Vila Olímpia', email: 'atendimento.h5362@accor.com' },
  { name: 'Manifesto Bar', email: 'contato@manifestobar.com.br' },
  { name: 'The World Hotels', email: 'reservations@traveltheworld.com.br' },
  { name: 'Le Jardin Rosewood', email: 'reservas.lejardin@rosewoodhotels.com' },
  { name: 'Fitó Pinheiros', email: 'contato@grupofito.com.br' },
  { name: 'Bar Martina', email: 'contato@grupo-ftr.com' },
  { name: 'Bernardino Restaurante', email: 'contato@bernardinorestaurante.com.br' },
  { name: 'Taco Bar Mexicano', email: 'tacosp@tacosp.com.br' },
];

const TEMPLATES = {
  consultivo: {
    subject: l => `Sugestão para o ${l.name}`,
    text: l => `Oi, tudo bem?\n\nSemana passada mandei uma mensagem sobre a Pindorama (cachaça artesanal). O Fasano já usa em cocktails.\n\nSe tiver um minuto, posso mandar mais informações ou uma amostra.\n\nAbs,\nGustavo\n(11) 91357-7900`,
    html: l => `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi, tudo bem?</p><p>Semana passada mandei uma mensagem sobre a Pindorama (cachaça artesanal). O <strong>Fasano já usa em cocktails</strong>.</p><p>Se tiver um minuto, posso mandar mais informações ou uma amostra.</p>${S}</div>`,
  },
};

const tpl = TEMPLATES.consultivo;

for (const l of leads) {
  try {
    await t.sendMail({
      from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
      to: l.email,
      subject: tpl.subject(l),
      text: tpl.text(l),
      html: tpl.html(l),
    });
    console.log('✅ ' + l.name);
  } catch (err) {
    console.error('❌ ' + l.name + ': ' + err.message);
  }
  await new Promise(r => setTimeout(r, 2500));
}

console.log('\nFollow-ups batch 2 concluído');
