import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 9135-7790';

const to = 'patricia@selmi.com.br';
const subject = 'Pindorama — proposta comercial para a Selmi (encaminhado pela Carolina)';
const text = `Olá, Patricia! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood. A Carolina Rocha (Vendas Internas) me encaminhou para você como responsável.

Conheço bem a história da Selmi — 130 anos, Renata e Galo, exportação para mais de 30 países. Trago uma proposta que pode dialogar com esse portfólio premium:

LINHA PINDORAMA
• Pindorama Clássica (prata envelhecida) — 700ml
• Pindorama Ouro (envelhecida em carvalho) — 700ml
• Cobra Coral de jabuticaba (premium) — 700ml

PROPOSTA COMERCIAL
• Amostra grátis da linha completa para avaliação
• Primeiro pedido bonificado para teste (leva o dobro do que pagar)
• Frete CIF por nossa conta
• 21 dias para pagar no primeiro pedido

CENÁRIOS EM QUE ISSO ENCAIXA NA SELMI
1. Kits corporativos de fim de ano (biscoito + cachaça premiada, com marca dos dois lados)
2. Linha de presentes executivos nos canais premium e exportação
3. Ativação de marca em eventos e feiras (Expo, salões de exportação)

Me passa o endereço de entrega e o CNPJ da Selmi que eu já separo o kit de amostras e mando a tabela comercial com os três SKUs. Se preferir, marco uma videochamada de 15 minutos para apresentar a linha.` + SIG;

await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
console.log('EMAIL OK: ' + to);

const lead = leads.find((l) => l.name === 'Selmi (Renata e Galo)');
if (lead) {
  lead.responded = true;
  lead.respondedAt = '2026-10-20';
  lead.hot = true;
  lead.contactName = 'Patricia João';
  lead.contactRole = 'compras';
  lead.context = ((lead.context || '') + ' | RESPONDEU 20/10: Carolina Rocha (supervisora vendas internas, ramal 8514) encaminhou para Patricia João patricia@selmi.com.br; proposta enviada').trim();
  writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
  console.log('LEAD ATUALIZADO: Selmi');
}
