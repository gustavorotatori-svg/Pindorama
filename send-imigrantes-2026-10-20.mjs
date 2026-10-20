import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 9135-7790';

const to = 'luciana.muniz@imigrantesbebidas.com.br';
const subject = 'Pindorama — proposta comercial para a Imigrantes Bebidas';
const text = `Olá, Luciana! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood. O atendimento me encaminhou para você como responsável pelas compras da Imigrantes.

Proposta comercial para a revenda:

LINHA PINDORAMA
• Pindorama Clássica (cachaça prata envelhecida) — 700ml
• Pindorama Ouro (envelhecida em carvalho) — 700ml
• Cobra Coral de jabuticaba (premium) — 700ml

CONDIÇÕES DE ABERTURA
• Amostra grátis da linha completa para avaliação
• Primeiro pedido bonificado para teste (leva o dobro do que pagar)
• Frete CIF (por nossa conta) para todo o Brasil
• 21 dias para pagar no primeiro pedido
• Margem de revenda de 35% a 45% sobre o recomendado ao varejo
• Material de ponto de venda (plaquinhas, listras e ficha de degustação) sem custo

PRÓXIMOS PASSOS
Me envia o endereço de entrega e o CNPJ da Imigrantes que eu já separo o kit de amostras e mando o preço de tabela com as três referências. Se preferir, marco uma videochamada de 15 minutos para apresentar a linha antes.

Fico no aguardo.` + SIG;

await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject, text });
console.log('EMAIL OK: ' + to);

const lead = leads.find((l) => l.name === 'Imigrantes Bebidas');
if (lead) {
  lead.responded = true;
  lead.respondedAt = '2026-10-20';
  lead.hot = true;
  lead.contactName = 'Luciana Muniz';
  lead.contactRole = 'compras';
  lead.context = ((lead.context || '') + ' | RESPONDEU 20/10: atendimento encaminhou para Luciana (compras) luciana.muniz@imigrantesbebidas.com.br; proposta enviada').trim();
  writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
  console.log('LEAD ATUALIZADO: Imigrantes Bebidas');
}
