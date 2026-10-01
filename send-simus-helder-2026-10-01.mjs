import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';

const to = 'heldercogo@simusbebidas.com.br';
const subject = 'Pindorama — amostra grátis + primeiro pedido bonificado (Simus Bebidas)';
const text = `Olá, Helder! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood.

Falei com o pessoal de vendas da Simus e me indicaram você como responsável pelas compras. Quero apresentar nossa linha (Clássica, Ouro e Cobra Coral de jabuticaba) para avaliar como nova linha de cachaça para a revenda:

• Amostra grátis para avaliação
• Primeiro pedido bonificado para teste
• Frete CIF e 21 dias para pagar

Posso enviar a apresentação e a tabela comercial? Para já separar as amostras, me passa o endereço de entrega e o CNPJ.` + SIG;

await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
console.log('EMAIL OK: ' + to);

const lead = leads.find((l) => l.name === 'Simus Bebidas');
if (lead) {
  lead.email = to;
  lead.email1 = true;
  lead.date1 = '2026-10-01';
  lead.responded = true;
  lead.hot = true;
  lead.contactName = 'Helder';
  lead.contactRole = 'responsavel por compras';
  writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
  console.log('LEAD ATUALIZADO: Simus Bebidas');
}
