import nodemailer from 'nodemailer';

const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' },
});

const GIF = 'https://iili.io/CkQ8gFR.gif';
const S = `<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;"><p style="margin:0;"><strong>Gustavo</strong></p><p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p><p style="margin:3px 0;">(11) 91357-7900 · cachaca011pindorama@gmail.com</p><img src="${GIF}" alt="Pindorama" style="max-width:280px;height:auto;border-radius:6px;margin-top:15px;" /></div>`;

const body = {
  subject: 'TUJU — cachaça artesanal para sua cozinha sazonal',
  text: `Oi,\n\nAcompanho o trabalho do TUJU e admiro a proposta de cozinha sazonal paulistana.\n\nTrabalho com cachaça artesanal (Pindorama) — o Fasano já usa em cocktails.\n\nAcho que combina com o conceito de vocês. Posso enviar uma amostra?\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`,
  html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>Acompanho o trabalho do <strong>TUJU</strong> e admiro a proposta de cozinha sazonal paulistana.</p><p>Trabalho com cachaça artesanal (Pindorama) — o <strong>Fasano já usa em cocktails</strong>.</p><p>Acho que combina com o conceito de vocês. Posso enviar uma amostra?</p>${S}</div>`,
};

await t.sendMail({ from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>', to: 'reserva@tuju.com.br', subject: body.subject, text: body.text, html: body.html });
console.log('✅ TUJU enviado');
