import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});
const G='https://iili.io/CkQ8gFR.gif';
const S=`<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;"><p style="margin:0;"><strong>Gustavo</strong></p><p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p><p style="margin:3px 0;">(11) 91357-7900 · cachaca011pindorama@gmail.com</p><img src="${G}" alt="Pindorama" style="max-width:280px;height:auto;border-radius:6px;margin-top:15px;" /></div>`;

const sends = [
  {to:'restaurante@ghee.com.br', subj:'Ghee — ideia para carta de drinks', text:'Oi,\n\nCozinha variada no Jardim Europa e tive uma ideia.\n\nTrabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails.\n\nSe quiser, posso sugerir combinações.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com'},
  {to:'contato@sushihall.com.br', subj:'Pergunta rápida — Sushi Hall', text:'Oi,\n\nPergunta rápida: o Sushi Hall trabalha com cachaça artesanal na carta?\n\nSe sim, tenho uma sugestão.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com'},
];

for (const s of sends) {
  await t.sendMail({from:'"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>', to:s.to, subject:s.subj, text:s.text, html:`<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p>${s.text.split('\n\n').slice(1).join('<br>')}${S}</div>`});
  console.log('✅ ' + s.to);
  await new Promise(r => setTimeout(r, 2500));
}
