import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});
const G='https://iili.io/CkQ8gFR.gif';
const S=`<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;"><p style="margin:0;"><strong>Gustavo</strong></p><p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p><p style="margin:3px 0;">(11) 91357-7900 · cachaca011pindorama@gmail.com</p><img src="${G}" alt="Pindorama" style="max-width:280px;height:auto;border-radius:6px;margin-top:15px;" /></div>`;
const T={
  consultivo:(l)=>({subject:`${l.name} — ideia para carta de drinks`,text:`Oi,\n\n${l.context} e tive uma ideia.\n\nTrabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails.\n\nSe quiser, posso sugerir combinações.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`,html:`<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>${l.context} e tive uma ideia.</p><p>Trabalho com cachaça artesanal (Pindorama) e o <strong>Fasano já usa em cocktails</strong>.</p><p>Se quiser, posso sugerir combinações.</p>${S}</div>`}),
  prova_social:(l)=>({subject:`Cachaça artesanal para ${l.name}`,text:`Oi,\n\nTrabalho com cachaça artesanal premium e ${l.name} me pareceu o perfil ideal.\n\nJá fornecemos para Fasano, Hilton, Rosewood.\n\nPosso enviar uma amostra?\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`,html:`<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>Trabalho com cachaça artesanal premium e <strong>${l.name}</strong> me pareceu o perfil ideal.</p><p>Já fornecemos para <strong>Fasano, Hilton, Rosewood</strong>.</p><p>Posso enviar uma amostra?</p>${S}</div>`}),
  pergunta:(l)=>({subject:`Pergunta rápida — ${l.name}`,text:`Oi,\n\nPergunta rápida: ${l.name} trabalha com cachaça artesanal na carta?\n\nSe sim, tenho uma sugestão.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`,html:`<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>Pergunta rápida: <strong>${l.name}</strong> trabalha com cachaça artesanal na carta?</p><p>Se sim, tenho uma sugestão.</p>${S}</div>`}),
};
const leads=[
  {name:'São Conrado Bar Itaim',email:'atendimento@gsbg.com.br',context:'bar tradicional no Itaim Bibi',template:'pergunta'},
  {name:'Bassano Itaim',email:'atendimento@bassano.com.br',context:'restaurante italiano no Itaim',template:'consultivo'},
  {name:'Caires Itaim Bar',email:'cairesitaim@gmail.com',context:'bar e restaurante variado no Itaim',template:'prova_social'},
  {name:"Fisherman's Table Itaim",email:'fishermanstable@gmail.com',context:'cozinha variada de frutos do mar',template:'consultivo'},
];
for(const l of leads){
  const e=T[l.template](l);
  try{await t.sendMail({from:'"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',to:l.email,subject:e.subject,text:e.text,html:e.html});console.log('✅ '+l.name);}
  catch(err){console.error('❌ '+l.name+': '+err.message);}
  await new Promise(r=>setTimeout(r,2500));
}
console.log('\nBatch 7 concluído');
