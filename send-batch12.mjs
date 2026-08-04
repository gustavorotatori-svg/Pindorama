import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});
const leads = JSON.parse(readFileSync('leads-qualificados.json','utf-8'));
const templates = {
  consultivo: `Olá {nome},

Vi que a {contexto} e pensei que a Pindorama faria sentido para vocês.

Somos uma cachaça artesanal premium produzida em fazenda própria no Vale do Café (RJ). Atendemos hotéis como Fasano, Hilton e Rosewood, e estamos expandindo nossa presença em SP.

Gostaria de saber se vocês trabalham com cachaça no cardápio e se estariam abertos a conhecer nossa linha.

Posso enviar mais informações ou passar para uma breve conversa?

Abraço,
Gustavo
Pindorama - Cachaça Artesanal
(11) 91357-7900`,

  prova_social: `Olá {nome},

Vi que a {contexto} e gostaria de apresentar a Pindorama.

Já estamos em contato com grupos como Fasano, Hilton e Rosewood, e a aceitação tem sido excelente — tanto em bares quanto em restaurantes.

Produzimos cachaça artesanal premium em fazenda própria no Vale do Café (RJ), com garrafas de design exclusivo que chamam atenção no balcão.

Vocês teriam interesse em conhecer nossa linha de cachaças premium?

Abraço,
Gustavo
Pindorama - Cachaça Artesanal
(11) 91357-7900`,

  pergunta: `Olá {nome},

Vi que a {contexto} e fiquei curioso — vocês trabalham com cachaça no cardápio atual?

Sou o Gustavo, da Pindorama. Somos uma cachaça artesanal premium do Vale do Café (RJ), com parcerias com hotéis como Fasano e Rosewood.

Gostaria de saber se faz sentido para vocês conhecerem nossa linha.

Vale uma troca de ideia rápida?

Abraço,
Gustavo
Pindorama - Cachaça Artesanal
(11) 91357-7900`
};
const gif = '<img src="https://iili.io/CkQ8gFR.gif" style="display:block;margin-top:12px;max-width:400px" />';

const today = '2026-07-29';
let count = 0;
for (const l of leads) {
  if (l.email1 || !templates[l.template]) continue;
  const text = templates[l.template].replace(/{nome}/g, l.name).replace(/{contexto}/g, l.context);
  const html = text.replace(/\n/g, '<br>') + '<br><br>' + gif;
  try {
    const r = await t.sendMail({
      from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
      to: l.email,
      subject: l.type === 'balada' ? 'Cachaça Pindorama para sua balada' : 'Cachaça artesanal premium para sua ' + l.type,
      text, html
    });
    l.email1 = true; l.date1 = today;
    console.log('OK ' + l.name + ' <' + l.email + '> ' + r.messageId);
    count++;
    await new Promise(r => setTimeout(r, 2500));
  } catch(e) { console.log('ERR ' + l.name + ': ' + e.message); }
}
writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('Sent: ' + count);
