import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});
const G='https://iili.io/CkQ8gFR.gif';
const S=`<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;"><p style="margin:0;"><strong>Gustavo</strong></p><p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p><p style="margin:3px 0;">(11) 91357-7900 · drinkpindorama.com</p><img src="${G}" alt="Pindorama" style="max-width:280px;height:auto;border-radius:6px;margin-top:15px;" /></div>`;
const sends=[
  {name:'Punta Cana Itaim',to:'puntacana@terra.com.br',ctx:'balada tropical no Itaim'},
  {name:'Adega da Vila Olímpia',to:'loja@adegadavila.com.br',ctx:'adega na Vila Olímpia'},
];
for(const s of sends){
  await t.sendMail({from:'"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',to:s.to,subject:`${s.name} — ideia para carta de drinks`,text:`Oi,\n\n${s.ctx} e tive uma ideia.\n\nTrabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails.\n\nSe quiser, posso sugerir combinações.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ndrinkpindorama.com`,html:`<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>${s.ctx} e tive uma ideia.</p><p>Trabalho com cachaça artesanal (Pindorama) e o <strong>Fasano já usa em cocktails</strong>.</p><p>Se quiser, posso sugerir combinações.</p>${S}</div>`});
  console.log('✅ '+s.name);
  await new Promise(r=>setTimeout(r,2500));
}
