import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));
const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';
const today = new Date().toISOString().slice(0, 10);

const DEST = ['emerson.silva@sonda.com.br', 'rafaela.santos@sonda.com.br'];
const subject = 'Pindorama — cachaça artesanal premium para a gôndola (amostra + pedido bonificado)';
const text = `Olá, Emerson e Rafaela! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood.

Escrevi ao Tiago e recebi o retorno automático indicando vocês como contatos atuais — por isso retomo por aqui. Quero apresentar nossa linha para a Sonda como fornecedor: Clássica, Ouro e Cobra Coral (jabuticaba), com bom giro em gôndola premium e margem saudável para a rede.

Proposta de entrada, sem risco:
• Amostra grátis para avaliação da equipe de compras
• Primeiro pedido bonificado para teste
• Frete CIF e 21 dias para pagar

Posso enviar apresentação, tabela e ficha técnica?` + SIG;

for (const to of DEST) {
  await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
  console.log('SONDA REENVIO: ' + to);
}
const lead = leads.find((l) => l.name === 'Sonda Supermercados');
if (lead) {
  lead.email = 'emerson.silva@sonda.com.br';
  lead.responded = true;
  lead.responseDate = today;
  lead.response = 'Tiago Gomes desligado; auto-reply indicou Emerson Silva e Rafaela Santos. Reenviado em 2026-09-28.';
  lead.email1 = true; lead.date1 = today;
  lead.respostaFollowupDate = today;
}
writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('Lead Sonda atualizado.');
