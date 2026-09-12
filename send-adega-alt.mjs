import nodemailer from 'nodemailer';

const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' },
});

const GIF = 'https://iili.io/CkQ8gFR.gif';
const S = `<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;"><p style="margin:0;"><strong>Gustavo</strong></p><p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p><p style="margin:3px 0;">(11) 91357-7900 · cachaca011pindorama@gmail.com</p><img src="${GIF}" alt="Pindorama" style="max-width:280px;height:auto;border-radius:6px;margin-top:15px;" /></div>`;

const l = { name: 'Adega Brooklin', context: 'adega mais gente boa de São Paulo' };
const email = {
  subject: `Cachaça artesanal para a ${l.name}`,
  text: `Oi,\n\nTrabalho com cachaça artesanal premium e a ${l.name} me pareceu o perfil ideal.\n\nJá fornecemos para Fasano, Hilton, Rosewood.\n\nPosso enviar uma amostra?\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`,
  html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>Trabalho com cachaça artesanal premium e a <strong>${l.name}</strong> me pareceu o perfil ideal.</p><p>Já fornecemos para <strong>Fasano, Hilton, Rosewood</strong>.</p><p>Posso enviar uma amostra?</p>${S}</div>`,
};

await t.sendMail({ from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>', to: 'adegabrooklin@terra.com.br', subject: email.subject, text: email.text, html: email.html });
console.log('✅ Adega Brooklin enviado (email alternativo)');
