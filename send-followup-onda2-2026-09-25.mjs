import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));
const byName = Object.fromEntries(leads.map((l) => [l.name, l]));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });

const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';

const MSGS = [
  { name: 'Imigrantes Bebidas',
    subject: 'Retomando — amostra grátis + pedido bonificado Pindorama',
    text: `Oi, pessoal da Imigrantes! Gustavo, da Pindorama. Vocês responderam em agosto e a conversa parou — retomo com motivo novo: amostra grátis para provarem a linha e primeiro pedido bonificado para teste, sem risco. Nossa cachaça artesanal do Vale do Café (RJ) atende Fasano, Hilton e Rosewood. Mando a amostra para qual endereço?` + SIG },
  { name: 'TEMPLO DA CARNE MARCOS BASSI',
    subject: 'Para o Templo da Carne — amostra grátis Pindorama',
    text: `Oi, Guilherme! Gustavo, da Pindorama. Retomo nosso contato de agosto: quero colocar nossa cachaça artesanal premium no Templo da Carne sem risco — amostra grátis para provar e primeiro pedido bonificado para teste. Faz sentido uma degustação aí na casa?` + SIG },
  { name: 'Zestzing Padaria Artesanal',
    subject: 'Retomando — amostra grátis para a Zestzing',
    text: `Oi! Gustavo, da Pindorama. Vocês responderam em agosto e não evoluímos — retomo com a condição atual: amostra grátis para avaliarem e primeiro pedido bonificado para teste. Nossa linha artesanal do Vale do Café combina com padaria artesanal. Mando a amostra para qual endereço?` + SIG },
  { name: 'Bendita Dose',
    subject: 'Bendita Dose + Pindorama — proposta para o ecommerce',
    text: `Oi, Silvio! Gustavo, da Pindorama. Você contou que a Bendita Dose é um ecommerce especializado — e é exatamente aí que vejo encaixe: nossa cachaça artesanal premium (Clássica, Ouro e Cobra Coral de jabuticaba) tem ótima apresentação para presenteáveis e kits. Posso mandar amostras para avaliação + primeiro pedido bonificado para teste?` + SIG },
];

const today = new Date().toISOString().slice(0, 10);
let sent = 0;
for (const m of MSGS) {
  const lead = byName[m.name];
  if (!lead) { console.log('LEAD NAO ENCONTRADO: ' + m.name); continue; }
  await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to: lead.email, subject: m.subject, text: m.text });
  console.log('FOLLOWUP ONDA2 ENVIADO: ' + m.name + ' <' + lead.email + '>');
  lead.respostaFollowupDate = today;
  sent++;
}
writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('Follow-ups onda2 enviados: ' + sent + '/4');
