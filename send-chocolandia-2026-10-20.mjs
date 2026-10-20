import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 9135-7790';

const to = 'yngrid.silva@chocolandia.com.br';
const subject = 'Pindorama — proposta comercial para a Chocolândia (encaminhado pelo SAC)';
const text = `Olá, Yngrid! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood. O SAC da Chocolândia me encaminhou para você como responsável.

Cheguei até vocês pensando em um cruzamento que dá certo: chocolate e cachaça premiam. Nossa linha tem encaixe direto com a casa de vocês —

• Pindorama Clássica (prata envelhecida) — combina com chocolate meio amargo
• Pindorama Ouro (envelhecida em carvalho) — combina com chocolate ao leite e caramelo
• Cobra Coral de jabuticaba (premium) — com chocolate branco e frutas vermelhas

PROPOSTA COMERCIAL
• Amostra grátis da linha completa para avaliação
• Primeiro pedido bonificado para teste (leva o dobro do que pagar)
• Frete CIF para SP, Guarulhos e Osasco
• 21 dias para pagar no primeiro pedido
• Margem de 35% a 45% no varejo recomendado
• Kit de degustação (taças, plaquinhas e ficha de harmonização chocolate × cachaça) sem custo

Ideias de ativação: harmonização na gôndola, kit presente data dos namorados, e degustação nas lojas.

Me passa o endereço de entrega e o CNPJ da Chocolândia que eu já separo o kit de amostras e mando a tabela com os três SKUs. Se quiser, apresento em uma videochamada de 15 minutos.` + SIG;

await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
console.log('EMAIL OK: ' + to);

const lead = leads.find((l) => l.name === 'Chocolandia');
if (lead) {
  lead.responded = true;
  lead.respondedAt = '2026-10-19';
  lead.hot = true;
  lead.contactName = 'Yngrid Silva';
  lead.contactRole = 'compras';
  lead.context = ((lead.context || '') + ' | RESPONDEU 19/10: SAC encaminhou para Yngrid Silva (compras) yngrid.silva@chocolandia.com.br; proposta enviada 20/10').trim();
  writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
  console.log('LEAD ATUALIZADO: Chocolandia');
}
