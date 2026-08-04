import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});
const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf-8'));
const today = '2026-07-29';
const gif = '<br><br><img src="https://iili.io/CkQ8gFR.gif" style="display:block;margin-top:12px;max-width:400px" />';

const template = `Ol\u00e1 {nome},

Tudo bem? Semana passada entrei em contato apresentando a Pindorama, cacha\u00e7a artesanal premium do Vale do Caf\u00e9 (RJ).

Nossa linha j\u00e1 est\u00e1 em hot\u00e9is como Fasano, Hilton e Rosewood, e temos condi\u00e7\u00f5es especiais de lan\u00e7amento para S\u00e3o Paulo.

Gostaria de saber se voc\u00eas tiveram a oportunidade de avaliar e se faz sentido para o card\u00e1pio de voc\u00eas.

Posso enviar uma amostra gratuita para conhecerem a qualidade. \u00c9 s\u00f3 me passar os dados cadastrais.

Abra\u00e7o,
Gustavo
Pindorama - Cacha\u00e7a Artesanal
(11) 91357-7900`;

let sent = 0;
for (const l of leads) {
  if (l.email2 || !l.email1 || l.date1 !== '2026-07-27') continue;
  const text = template.replace(/{nome}/g, l.name.split(' ')[0]);
  const html = text.replace(/\n/g, '<br>') + gif;
  try {
    const r = await t.sendMail({
      from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
      to: l.email,
      subject: 'Sobre a Pindorama —' + (l.type === 'adega' ? ' linhas para sua adega' : ' cacha\u00e7a para seu' + (l.type === 'bar' ? ' bar' : ' restaurante')),
      text, html
    });
    l.email2 = true; l.date2 = today;
    console.log('OK ' + l.name + ' <' + l.email + '>');
    sent++;
    await new Promise(r => setTimeout(r, 2500));
  } catch(e) { console.log('ERR ' + l.name + ': ' + e.message); }
}
writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('Email2 sent: ' + sent);
