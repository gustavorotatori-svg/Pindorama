import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';

const to = 'janete.neckel@decanter.com.br';
const subject = 'Pindorama — cachaça artesanal premium para a Decanter (amostra grátis)';
const text = `Olá, Janete! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood.

Falei com o canal de vendas ao consumidor de vocês e me indicaram você como contato da área de compras. Quero apresentar nossa linha (Clássica, Ouro e Cobra Coral de jabuticaba) para uma possível parceria de distribuição:

• Amostra grátis para avaliação
• Primeiro pedido bonificado para teste
• Frete CIF e 21 dias para pagar

Posso enviar a apresentação e a tabela comercial? Para mandar as amostras, me passa o endereço de entrega e o CNPJ.` + SIG;

await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
console.log('EMAIL DECANTER ENVIADO: ' + to);

let lead = leads.find((l) => l.name === 'Decanter');
if (!lead) {
  lead = { name: 'Decanter', email: to, type: 'distribuidora', neighborhood: '', context: 'Importadora/distribuidora de vinhos; contato da área de compras indicado pelo canal de vendas ao consumidor.', phone: '', website: 'https://www.decanter.com.br', emailVerified: false, emailSource: 'resposta recebida 2026-09-25', email1: true, date1: new Date().toISOString().slice(0, 10), template: 'consultivo' };
  leads.push(lead);
} else {
  lead.email = to; lead.email1 = true;
}
lead.responded = true;
lead.responseDate = new Date().toISOString().slice(0, 10);
lead.response = 'Canal de vendas ao consumidor respondeu e indicou a área de compras: janete.neckel@decanter.com.br. Apresentação enviada em 2026-09-25.';
lead.respostaFollowupDate = new Date().toISOString().slice(0, 10);
writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('Lead Decanter registrado.');
