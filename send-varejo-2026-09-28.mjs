import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));
const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';
const today = new Date().toISOString().slice(0, 10);

const NOVOS = [
  { name: 'Roldão Atacadista', email: 'roldao@roldao.com.br', type: 'supermercado', neighborhood: 'Guarulhos', context: 'Rede atacadista (Guarulhos/SP); canal fornecedor.', phone: '(11) 5095-4000', website: 'https://www.roldao.com.br', emailVerified: true, emailSource: 'https://cnpjcheck.com.br/empresa/roldao-auto-servico-comercio-de-alimentos-s-a-grupo-roldao-s-a-05800256000954' },
  { name: 'Sonda Supermercados', email: 'tiago.gomes@sonda.com.br', type: 'supermercado', neighborhood: 'São Vicente', context: 'Rede de supermercados (Baixada/SP); contato comercial.', phone: '(13) 3569-1360', website: 'https://sonda.com.br', emailVerified: true, emailSource: 'https://casadosdados.com.br/solucao/cnpj/sonda-supermercados-exportacao-e-importacao-sa-01937635001820' },
  { name: 'Castelão Supermercados', email: 'fornecedor@castelao.com.br', type: 'supermercado', neighborhood: 'Jabaquara', context: 'Rede supermercadista (SP); canal seja-fornecedor.', phone: '(11) 5033-9300', website: 'http://www.castelao.com.br/seja-fornecedor', emailVerified: true, emailSource: 'http://www.castelao.com.br/seja-fornecedor' },
];

const subject = 'Pindorama — cachaça artesanal premium para a gôndola (amostra + pedido bonificado)';
const text = (nome) => `Olá! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood.

Quero apresentar nossa linha para a ${nome} como fornecedor: Clássica, Ouro e Cobra Coral (jabuticaba), com ótimo giro em gôndola premium e margem saudável para a rede.

Proposta de entrada, sem risco:
• Amostra grátis para avaliação da equipe de compras
• Primeiro pedido bonificado para teste
• Frete CIF e 21 dias para pagar

Posso enviar apresentação, tabela e ficha técnica?` + SIG;

let n = 0;
for (const l of NOVOS) {
  await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to: l.email, subject, text: text(l.name) });
  console.log('VAREJO ENVIADO: ' + l.name + ' <' + l.email + '>');
  const ex = leads.find((x) => (x.email || '').toLowerCase() === l.email.toLowerCase());
  const rec = { ...l, email1: true, date1: today, template: 'consultivo', responded: false, respostaFollowupDate: '' };
  if (ex) Object.assign(ex, rec); else leads.push(rec);
  n++;
}
writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('Varejistas contatados: ' + n + '/3');
