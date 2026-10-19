import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 9135-7790';

const to = 'comercial@basilicata.com.br';
const subject = 'Re: Pindorama — Washington salvo + amostra para avaliação (Basilicata)';
const text = `Olá, Lucas! Tudo bem por aí? Perfeito, anotei o Washington — (11) 99400-4272 — já está como nosso contato de compras Basilicata.

Sobre os grupos que você citou: as compras de cada um são centralizadas no time de suprimentos deles e eu não divulo contatos pessoais sem autorização. Mas posso fazer a apresentação dos dois lados — me confirma que posso repassar seus dados ao time de compras do Fasano, Hilton e Rosewood? Assim que você autorizar, eu já tiro a introdução hoje ainda.

Enquanto isso, vamos fechar a parte da Pindorama: quero enviar para o Washington uma caixa de avaliação com a linha completa (Clássica, Ouro e Cobra Coral de jabuticaba), com o primeiro pedido bonificado para teste e frete por nossa conta.

Me passa o endereço de entrega e o CNPJ da Basilicata que eu separo o envio hoje.` + SIG;

await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
console.log('EMAIL OK: ' + to);

const lead = leads.find((l) => String(l.email || '').toLowerCase() === to);
if (lead) {
  lead.repliedAt = '2026-10-19';
  lead.repliedCount = (lead.repliedCount || 0) + 1;
  lead.contactName = 'Washington';
  lead.contactRole = 'compras';
  lead.hot = true;
  writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
  console.log('LEAD ATUALIZADO: Basilicata');
}
