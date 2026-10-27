import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });
const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 9135-7790';

const hoje = new Date().toISOString().slice(0, 10);

const quentes = [
  { name: 'Basilicata Pão Italiano e Restaurante', email: 'comercial@basilicata.com.br', contato: 'Washington', contatoTel: '(11) 99400-4272', contexto: 'Padaria, Empório e Restaurante italiano' },
  { name: 'Imigrantes Bebidas', email: 'atendimento@imigrantesbebidas.com.br', contato: 'Luciana Muniz', contatoTel: '', contexto: 'rede com 6 lojas em SP (Água Funda, Vila Ema, Lapa, Butantã, Água Fria, Itaim Bibi)' },
  { name: 'Chocolandia', email: 'sac@chocolandia.com.br', contato: 'Yngrid Silva', contatoTel: '', contexto: '6 lojas + atacado, SP + Guarulhos + Osasco' },
  { name: 'Yacuy Indústria de Erva-Mate', email: 'atendimento@yacuy.com.br', contato: 'Rafael', contatoTel: '(47) 99129-8317', contexto: 'erva-mate orgânica brasileira, mais de 75 anos' },
  { name: 'Selmi (Renata e Galo)', email: 'televendas@selmi.com.br', contato: 'Patricia João', contatoTel: '(19) 3873-8400 ramal 8514', contexto: 'biscoitos (marca Renata) e massas (marca Galo), exportação para mais de 30 países' },
];

const textoPadrao = (c) => `Olá, ${c.contato}! Tudo bem?

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood.

Grato pelo retorno. Como conversamos, segue abaixo o catálogo da nossa linha:

LINHA PINDORAMA
• Pindorama Clássica (prata envelhecida) — 700ml
• Pindorama Ouro (envelhecida em carvalho) — 700ml
• Cobra Coral de jabuticaba (premium) — 700ml

CONDIÇÕES COMERCIAIS
• Frete CIF por nossa conta
• 21 dias para pagar no primeiro pedido
• Margem de revenda de 35% a 45% sobre o preço recomendado ao varejo
• Material de ponto de venda (plaquinhas, listras e ficha de degustação) sem custo

Para eu te enviar a tabela de preços atualizada e condições exclusivas para a ${c.contexto}, preciso apenas dos dados cadastrais:

• Razão social e CNPJ
• Endereço de entrega completo (rua, número, complemento, bairro, cidade, CEP)
• Nome do responsável e WhatsApp para contato

Assim que receber, monto a proposta e envio a tabela imediatamente.` + SIG;

for (const c of quentes) {
  const lead = leads.find((l) => l.name === c.name);
  const texto = textoPadrao(c);
  const assunto = `Pindorama — catálogo e tabela de preços para ${c.contexto}`;

  await transporter.sendMail({
    from: `"Gustavo - Pindorama" <${MAIL_USER}>`,
    to: c.email,
    subject: assunto,
    text: texto
  });
  console.log('EMAIL OK: ' + c.email + ' (' + c.name + ')');

  if (lead) {
    lead.responded = true;
    lead.respondedAt = hoje;
    lead.propostaEnviada = hoje;
    lead.hot = true;
    lead.context = ((lead.context || '') + ' | PROPOSTA ENVIADA ' + hoje + ': catálogo + tabela de preços solicitados; aguardando cadastro (CNPJ + endereço)').trim();
  }
}

writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('LEADS ATUALIZADOS: 5 propostas comerciais enviadas');
