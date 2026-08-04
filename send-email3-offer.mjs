import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});

// Email3: last attempt + special offer
const oldLeads = JSON.parse(readFileSync('leads.json', 'utf-8'));
const newLeads = JSON.parse(readFileSync('leads-qualificados.json', 'utf-8'));

const today = '2026-07-29';
let sent3 = 0;

const email3Text = `Ol\u00e1 {nome},

Esse \u00e9 meu \u00faltimo contato por aqui — n\u00e3o quero incomodar, mas tamb\u00e9m n\u00e3o quero que voc\u00eas percam a oportunidade de conhecer a Pindorama.

Estamos em fase de LAN\u00c7AMENTO em S\u00e3o Paulo e com condi\u00e7\u00f5es especiais para os primeiros pedidos:

🎯 10% OFF na primeira compra
🚚 Frete CIF (por nossa conta)
💳 Pagamento em 21 dias (boleto)
📦 Pedido m\u00ednimo: 1 caixa

Nossa linha:

🥃 Cl\u00e1ssica (750ml) — R$ 84,00
🥇 Ouro (700ml) — R$ 120,00
🪸 Cobra Coral (600ml) — R$ 42,00
🍶 Miniaturas (200ml) — R$ 20 a R$ 35

Essa oferta \u00e9 v\u00e1lida at\u00e9 02/08.

Quer testar? Posso enviar uma AMOSTRA GR\u00c1TIS para voc\u00eas provarem antes de qualquer pedido. Basta me enviar os dados cadastrais (Raz\u00e3o Social, CNPJ, Endere\u00e7o) que emiss\u00e3o a NF de Amostra.

Se quiser algo, \u00e9 s\u00f3 responder esse email ou me ligar.

Abra\u00e7o,
Gustavo
Pindorama — Cacha\u00e7a Artesanal
(11) 91357-7900`;

const gifTag = '<br><br><img src="https://iili.io/CkQ8gFR.gif" style="display:block;margin-top:12px;max-width:400px" />';

// 1. Email3 for old leads (have email2, DNS-valid, not Miró)
const dnsValid = ['isabella@bardojuarez.com.br','reserva@iulia.com.br','marketing@barcharles.com.br','contato@dopabar.com.br','info@seogomes.com.br','gero@fasano.com.br','restaurante@fasano.com.br','contato@ristorantino.com.br','reservas@wzhoteljardins.com.br','reservas@hoteltrianon.com.br','melia.jardim.europa@solmelia.com','comercial.adegabianchi@gmail.com'];

for (const l of oldLeads) {
  if (!dnsValid.includes(l.email)) continue;
  if (l.name === 'Mir\u00f3 Gastronomia') continue; // already responded
  if (!l.email2) continue; // skip if no email2 yet
  if (l.email3) continue; // already sent

  const text = email3Text.replace(/{nome}/g, l.name.split(' ')[0]);
  const html = text.replace(/\n/g, '<br>') + gifTag;

  try {
    const r = await t.sendMail({
      from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
      to: l.email,
      subject: '\u00daltimo contato — oferta especial de lan\u00e7amento Pindorama',
      text, html
    });
    l.email3 = true;
    l.date3 = today;
    console.log('EMAIL3 OK ' + l.name + ' <' + l.email + '>');
    sent3++;
    await new Promise(r => setTimeout(r, 2500));
  } catch(e) {
    console.log('ERR ' + l.name + ': ' + e.message);
  }
}

writeFileSync('leads.json', JSON.stringify(oldLeads, null, 2));
console.log('Total email3 sent: ' + sent3);
