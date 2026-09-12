import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import { sendWithinEmailQuota, emailQuotaStatus } from './email-quota.mjs';

const targets = [
  { email: 'concierge@wdgevents.com', subject: 'Cachaça artesanal para experiências da WDG Events', text: 'Vi que a WDG Events cria destination weddings e eventos premium com gastronomia, welcome drinks e coquetelaria autoral. A Pindorama pode entrar em uma degustação brasileira ou em coquetéis da experiência.' },
  { email: 'eventos.sp@panamby.com.br', subject: 'Uma opção brasileira para os eventos do Panamby', text: 'Vi que o Hotel Panamby São Paulo mantém uma estrutura comercial dedicada a eventos. A Pindorama pode complementar o serviço de bebidas em recepções, degustações e encontros corporativos.' },
  { email: 'comercial@allpartyeventos.com.br', subject: 'Pindorama no open bar da All Party', text: 'Vi que a All Party trabalha com buffet completo, open bar e eventos corporativos e de formatura. A Pindorama pode entrar como cachaça artesanal em caipirinhas ou em uma degustação brasileira.' },
  { email: 'eventos.campinas@vitoriahoteis.com.br', subject: 'Cachaça artesanal para eventos no Vitória Concept', text: 'Vi que o Vitória Concept Campinas oferece casamentos e eventos com buffet próprio, bebidas selecionadas e opção de open bar. A Pindorama pode complementar esse serviço com uma cachaça artesanal do Vale do Café.' },
  { email: 'reservas@bourbon.com.br', subject: 'Uma opção artesanal brasileira para o Bourbon Santos', text: 'Vi que o Bourbon Convention Santos reúne um grande centro de eventos, operação de alimentos e bebidas e bares com coquetéis. A Pindorama pode entrar em caipirinhas, degustações ou recepções temáticas.' },
  { email: 'contato@hortifrutihigienopolis.com.br', subject: 'Novo destilado artesanal para a adega do Hortifruti Higienópolis', text: 'Vi que o Hortifruti Higienópolis opera quatro unidades, delivery e uma adega com destilados e bebidas especiais. A Pindorama pode complementar essa seleção com um rótulo artesanal premium.' },
  { email: 'comercial@vivacachaca.com', subject: 'Pindorama para a curadoria da Viva Cachaça', text: 'Vi que a Viva Cachaça atua com loja, degustações, cursos, alambique urbano e consultoria para bares e restaurantes. A Pindorama pode somar à curadoria como rótulo artesanal produzido no Vale do Café.' }
];

const file = 'leads-qualificados.json';
const leads = JSON.parse(readFileSync(file, 'utf8'));
const suppressed = new Set(JSON.parse(readFileSync('suppressed-emails.json', 'utf8')).map(x => String(x).toLowerCase()));
if (!process.env.GMAIL_APP_PASSWORD) throw new Error('GMAIL_APP_PASSWORD ausente');
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: 'cachaca011pindorama@gmail.com', pass: process.env.GMAIL_APP_PASSWORD } });
const results = [];

for (const target of targets) {
  const lead = leads.find(x => x.email?.toLowerCase() === target.email);
  if (!lead || lead.email1 || suppressed.has(target.email)) {
    results.push({ email: target.email, sent: false, reason: !lead ? 'missing' : lead.email1 ? 'duplicate' : 'suppressed' });
    continue;
  }
  const body = `Olá, tudo bem?\n\n${target.text} Sou Gustavo, da Pindorama.\n\nPosso enviar uma amostra gratuita para vocês avaliarem? Se outra pessoa cuida das compras ou das bebidas, você pode me indicar?\n\nObrigado,\nGustavo\nPindorama - Cachaça Artesanal\n(11) 91357-7900\ncachaca011pindorama@gmail.com`;
  try {
    const result = await sendWithinEmailQuota(() => transporter.sendMail({
      from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
      to: target.email,
      subject: target.subject,
      text: body
    }));
    if (!result.sent) {
      results.push({ email: target.email, sent: false, reason: result.reason });
      break;
    }
    lead.email1 = true;
    lead.date1 = '2026-08-30';
    lead.status = 'contacted';
    lead.messageId1 = result.result.messageId;
    writeFileSync(file, JSON.stringify(leads, null, 2));
    results.push({ email: target.email, sent: true, accepted: result.result.accepted, rejected: result.result.rejected, messageId: result.result.messageId, response: result.result.response });
  } catch (error) {
    results.push({ email: target.email, sent: false, reason: error.message });
  }
}

console.log(JSON.stringify({ results, quota: emailQuotaStatus() }));
