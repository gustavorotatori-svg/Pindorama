import nodemailer from 'nodemailer';

const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' },
});

await t.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to: 'portovila@ig.com.br',
  subject: 'Porto Vila Bar — ideia para carta de drinks',
  text: 'Oi,\n\nbar tradicional na Vila Nova Conceição e tive uma ideia para a carta de drinks.\n\nTrabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails.\n\nSe quiser, posso sugerir combinações que funcionam bem — sem compromisso.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ndrinkpindorama.com',
});

console.log('✅ Porto Vila enviado');
