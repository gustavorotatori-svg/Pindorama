import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf8'));
const byName = Object.fromEntries(leads.map((l) => [l.name, l]));

const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } });

const SIG = '\n\nAbraço,\nGustavo\nPindorama — Cachaça Artesanal\n(11) 91357-7900';

const MSGS = [
  { name: 'Degusti Vinhos', to: 'atendimento@degusti.com.br',
    subject: 'Retomando: primeiro pedido bonificado para teste — Pindorama',
    text: `Oi, pessoal da Degusti! Gustavo, da Pindorama. Enviei tabela e condições comerciais e não tive retorno — passo para retomar: seguimos com o primeiro pedido bonificado para teste, vocês experimentam a linha sem risco. A tabela que mandei continua valendo? Posso agendar uma degustação aí na loja?` + SIG },
  { name: 'WDG Events', to: 'concierge@wdgevents.com',
    subject: 'Retomando a parceria — primeiro pedido bonificado para teste',
    text: `Oi! Gustavo, da Pindorama. Vocês confirmaram abertura para parceria e indicaram o André para alinhamento. Tento evoluir e não consigo — pode me ajudar a retomar? Reforço: primeiro pedido bonificado para teste nos eventos de vocês, sem compromisso.` + SIG },
  { name: 'Vitoria Concept Campinas', to: 'eventos.campinas@vitoriahoteis.com.br',
    subject: 'Para o setor de compras — primeiro pedido bonificado para teste',
    text: `Oi, Isabela! Gustavo, da Pindorama. Você gentilmente encaminhou nossa apresentação ao setor de compras e não tive retorno. Retomo com um motivo novo: primeiro pedido bonificado para teste para o hotel, sem risco. Consegue me passar o contato direto do comprador?` + SIG },
  { name: 'Bourbon Convention Hotel Santos', to: 'reservas@bourbon.com.br',
    subject: 'Para a equipe do Bourbon Santos — primeiro pedido bonificado',
    text: `Oi! Gustavo, da Pindorama. A central direcionou nossa solicitação à equipe do Bourbon Santos para análise e não tive retorno. Retomo com novidade: primeiro pedido bonificado para teste para o hotel. Quem seria a pessoa certa para eu falar sobre bar e eventos?` + SIG },
];

const today = new Date().toISOString().slice(0, 10);
let sent = 0;
for (const m of MSGS) {
  const lead = byName[m.name];
  if (!lead) { console.log('LEAD NAO ENCONTRADO: ' + m.name); continue; }
  const to = lead.email || m.to;
  await transporter.sendMail({ from: `"Gustavo - Pindorama" <${MAIL_USER}>`, to, subject: m.subject, text: m.text });
  console.log('FOLLOWUP ENVIADO: ' + m.name + ' <' + to + '>');
  lead.respostaFollowupDate = today;
  sent++;
}
writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('Follow-ups enviados: ' + sent + '/4');
