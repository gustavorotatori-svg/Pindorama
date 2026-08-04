import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const leadsPath = join(process.cwd(), 'leads.json');
const qualifiedPath = join(process.cwd(), 'leads-qualificados.json');
const oldLeads = JSON.parse(readFileSync(leadsPath, 'utf8'));
const qualLeads = JSON.parse(readFileSync(qualifiedPath, 'utf8'));
const leads = oldLeads.concat(qualLeads);

function localToday() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; }

function saveLead(lead) {
  const arr = oldLeads.includes(lead) ? oldLeads : qualLeads;
  const file = oldLeads.includes(lead) ? leadsPath : qualifiedPath;
  writeFileSync(file, JSON.stringify(arr, null, 2));
}

const imapConfig = {
  user: 'cachaca011pindorama@gmail.com',
  password: 'wnau jrrr rjpc zuuv',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
});

const signature = `
---
Gustavo
Pindorama - Cachaça Artesanal
📧 cachaca011pindorama@gmail.com
📞 (11) 91357-7900
🌐 drinkpindorama.com`;

function getResponse(subject, body, lead) {
  // Remove quoted text (reply/forward) to avoid matching our own messages
  const clean = body.replace(/^>.*$/gm, '').trim();
  const text = (subject + ' ' + clean).toLowerCase();

  // If we already asked this lead for cadastro, stop asking
  if (lead && lead.askedCadastro) return null;

  // Cliente quer amostra
  if (text.includes('amostra') || text.includes('prova') || text.includes('experimentar') || text.includes('gostaria de receber')) {
    if (lead) lead.askedCadastro = true;
    return `Olá,

Ficamos muito felizes com seu interesse!

Para envio das amostras, preciso dos seguintes dados cadastrais para emissão da NF de Amostra (gratuita):

• Razão Social
• CNPJ
• Endereço completo (rua, número, bairro, cidade, CEP)
• Nome para contato

Assim que receber os dados, envio as amostras para que vocês conheçam a qualidade Pindorama.

Abraço,
Gustavo${signature}`;
  }

  // Condições comerciais
  if (text.includes('condiç') || text.includes('pagamento') || text.includes('prazo') || text.includes('frete') || text.includes('entrega')) {
    return `Olá,

Segue nossas condições comerciais:

📦 Pedido mínimo: 1 caixa
💳 Pagamento: 21 dias (boleto)
🚚 Entrega: D+2 dias úteis após confirmação do pedido
🚛 Frete: CIF (por nossa conta)

Também oferecemos amostra gratuita para que vocês conheçam a linha Pindorama.

Quer que eu envie as amostras?

Abraço,
Gustavo${signature}`;
  }

  // Preço
  if (text.includes('preço') || text.includes('valor') || text.includes('quanto custa') || text.includes('quanto sai') || text.includes('tabela')) {
    return `Olá,

Obrigado pelo interesse!

Segue nossa tabela de preços (atacado):

🟢 CLÁSSICA 750ml - R$ 84,00
🟡 OURO 700ml - R$ 120,00
🔴 COBRA CORAL 600ml - R$ 42,00

Miniaturas (200ml): R$ 20,00 a R$ 35,00

Além dos preços, oferecemos aos parceiros: amostra gratuita, degustadoras para ações no seu estabelecimento, treinamento da equipe, bonificação no primeiro pedido e frete CIF com pagamento em 21 dias. Trabalhamos com margem saudável justamente para valorizar o canal de venda, sem queima de preços.

Quer que eu envie as amostras?

Abraço,
Gustavo${signature}`;
  }

  // Visita
  if (text.includes('visita') || text.includes('agendar') || text.includes('ir até') || text.includes('ver pessoalmente')) {
    return `Olá,

Perfeito! Fico feliz em agendar uma visita.

Por favor, me envie:
• Endereço completo do estabelecimento
• Horários disponíveis
• Nome de quem será o contato

Posso ir qualquer dia da semana, no horário que melhor para vocês.

Abraço,
Gustavo${signature}`;
  }

  // Não tem interesse
  if (text.includes('não tenho interesse') || text.includes('não nos interessa') || text.includes('não faremos') || text.includes('obrigado mas')
      || text.includes('não temos interesse') || text.includes('sem interesse') || text.includes('não quero') || text.includes('dispenso')
      || text.includes('não precisa') || text.includes('não é para nós') || text.includes('por enquanto não')) {
    return `Olá,

Entendo perfeitamente! Obrigado pela atenção.

Caso mude de ideia no futuro, estou à disposição. Uma ótima semana!

Abraço,
Gustavo${signature}`;
  }

  // Sobre a cachaça
  if (text.includes('como é feita') || text.includes('produção') || text.includes('ingredientes') || text.includes('sobre a cachaça') || text.includes('mais sobre')) {
    return `Olá,

Fico feliz em compartilhar mais sobre a Pindorama!

🏠 Produção: Fazenda das Palmas, Vale do Café, Rio de Janeiro
🌿 Canaviais orgânicos cercados por 200 hectares de Mata Atlântica
🏆 Parcerias com Fasano, Hilton, Rosewood e Emiliano

Nossa linha inclui:
• Clássica (750ml) - cachaça envelhecida
• Ouro (700ml) - cachaça premium envelhecida
• Cobra Coral (600ml) - cachaça envelhecida com jabuticaba
• Miniaturas (200ml) - Clássica, Ouro e Cobra Coral

Todas as garrafas possuem tampa Loca e cork, design exclusivo e são premium.

Posso enviar amostras para vocês conhecerem?

Abraço,
Gustavo${signature}`;
  }

  // Resposta padrão (não sabe responder)
  return null;
}

function checkEmails() {
  const imap = new Imap(imapConfig);

  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('Erro ao abrir inbox:', err);
        imap.end();
        return;
      }

      // Buscar emails não lidos
      imap.search(['UNSEEN'], (err, results) => {
        if (err) {
          console.error('Erro ao buscar emails:', err);
          imap.end();
          return;
        }

        if (results.length === 0) {
          console.log('📭 Nenhum email novo');
          imap.end();
          return;
        }

        console.log(`📬 ${results.length} email(s) novo(s) encontrado(s)`);

        const fetch = imap.fetch(results, { bodies: '' });
        let processedCount = 0;

        fetch.on('message', (msg, seqno) => {
          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                console.error('Erro ao parsear email:', err);
                return;
              }

              const from = parsed.from?.text || '';
              const subject = parsed.subject || '';
              const body = parsed.text || '';

              console.log(`\n📧 De: ${from}`);
              console.log(`📋 Assunto: ${subject}`);

              // Verificar se é de um lead conhecido (match exato por email ou domínio)
              const fromAddr = (parsed.from?.value?.[0]?.address || '').toLowerCase();
              const domain = fromAddr.split('@')[1] || '';
              const lead = leads.find(l => {
                const leadEmail = (l.email || '').toLowerCase();
                const leadDomain = leadEmail.split('@')[1] || '';
                return fromAddr === leadEmail || (domain === leadDomain && domain.length > 3);
              });

              if (!lead) {
                console.log('⚠️ Email não é de um lead conhecido, ignorando');
                processedCount++;
                if (processedCount >= results.length) imap.end();
                return;
              }

              console.log(`✅ Lead identificado: ${lead.name}`);

              // Não re-responder leads já tratados
              if (lead.responded) {
                console.log(`↩️ ${lead.name} já foi respondido, pulando`);
                processedCount++;
                if (processedCount >= results.length) imap.end();
                return;
              }

              // Gerar resposta
              const response = getResponse(subject, body, lead);

              if (!response) {
                console.log(`❓ Não sei responder este email de ${lead.name}`);
                console.log(`📩 Mensagem: ${body.substring(0, 200)}...`);
                processedCount++;
                if (processedCount >= results.length) imap.end();
                return;
              }

                // Enviar resposta (usar email do remetente, não o cadastrado)
              try {
                await transporter.sendMail({
                  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
                  to: fromAddr || lead.email,
                  subject: `Re: ${subject}`,
                  text: response,
                });
                console.log(`✅ Resposta automática enviada para ${lead.name}`);

                // Atualizar lead no arquivo correto
                lead.responded = true;
                lead.responseDate = localToday();
                saveLead(lead);
              } catch (error) {
                console.error(`❌ Erro ao enviar resposta: ${error.message}`);
              }

              processedCount++;
              if (processedCount >= results.length) imap.end();
            });
          });
        });

        fetch.once('error', (err) => {
          console.error('Erro no fetch:', err);
          imap.end();
        });
      });
    });
  });

  imap.once('error', (err) => {
    console.error('Erro IMAP:', err);
  });

  imap.connect();
}

// Executar verificação
console.log('🔍 Verificando emails...');
checkEmails();
