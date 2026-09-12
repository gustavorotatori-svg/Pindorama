import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});
const G='https://iili.io/CkQ8gFR.gif';
const S=`<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;"><p style="margin:0;"><strong>Gustavo</strong></p><p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p><p style="margin:3px 0;">(11) 91357-7900 · cachaca011pindorama@gmail.com</p><img src="${G}" alt="Pindorama" style="max-width:280px;height:auto;border-radius:6px;margin-top:15px;" /></div>`;
const sends=[
  {name:'Enigma Club Moema',to:'enigmaclub@enigmaclub.com.br',ctx:'balada liberal em Moema',tpl:'pergunta'},
  {name:'Memphis All Music Moema',to:'memphisallmusic@hotmail.com',ctx:'balada all music em Moema',tpl:'consultivo'},
  {name:'Danado de Bom Pinheiros',to:'producao@danadodebom.com.br',ctx:'casa de shows em Pinheiros',tpl:'pergunta'},
];
for(const s of sends){
  let subj,text,html;
  if(s.tpl==='pergunta'){
    subj=`Pergunta rápida — ${s.name}`;
    text=`Oi,\n\nPergunta rápida: ${s.name} trabalha com cachaça artesanal na carta?\n\nSe sim, tenho uma sugestão.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`;
    html=`<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>Pergunta rápida: <strong>${s.name}</strong> trabalha com cachaça artesanal na carta?</p><p>Se sim, tenho uma sugestão.</p>${S}</div>`;
  }else{
    subj=`${s.name} — ideia para carta de drinks`;
    text=`Oi,\n\n${s.ctx} e tive uma ideia.\n\nTrabalho com cachaça artesanal (Pindorama) e o Fasano já usa em cocktails.\n\nSe quiser, posso sugerir combinações.\n\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`;
    html=`<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;"><p>Oi,</p><p>${s.ctx} e tive uma ideia.</p><p>Trabalho com cachaça artesanal (Pindorama) e o <strong>Fasano já usa em cocktails</strong>.</p><p>Se quiser, posso sugerir combinações.</p>${S}</div>`;
  }
  await t.sendMail({from:'"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',to:s.to,subject:subj,text:text,html:html});
  console.log('✅ '+s.name);
  await new Promise(r=>setTimeout(r,2500));
}
