import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const leadsPath = join(process.cwd(), 'leads.json');
const leads = JSON.parse(readFileSync(leadsPath, 'utf8'));

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

  if (text.includes('amostra') || text.includes('prova') || text.includes('experimentar') || text.includes('gostaria de receber') || text.includes('quero receber') || text.includes('manda') || text.includes('envia')) {
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

  if (text.includes('condiç') || text.includes('pagamento') || text.includes('prazo') || text.includes('frete') || text.includes('entrega') || text.includes('como funciona')) {
    return `Olá,

Segue nossa tabela de preços e condições comerciais:

🟢 CLÁSSICA 750ml - R$ 84,00
🟡 OURO 700ml - R$ 120,00
🔴 COBRA CORAL 600ml - R$ 42,00

MINIATURAS 200ml:
🟢 Clássica - R$ 30,00
🟡 Ouro - R$ 35,00
🔴 Cobra Coral - R$ 20,00

Condições:
📦 Pedido mínimo: 1 caixa
💳 Pagamento: 21 dias (boleto)
🚚 Entrega: D+2 dias úteis
🚛 Frete: CIF (por nossa conta)

Também oferecemos amostra gratuita para que vocês conheçam a linha Pindorama.

Quer que eu envie as amostras?

Abraço,
Gustavo${signature}`;
  }

  if (text.includes('preço') || text.includes('valor') || text.includes('quanto custa') || text.includes('quanto sai') || text.includes('tabela')) {
    return `Olá,

Segue nossa tabela de preços:

🟢 CLÁSSICA 750ml - R$ 84,00
🟡 OURO 700ml - R$ 120,00
🔴 COBRA CORAL 600ml - R$ 42,00

MINIATURAS 200ml:
🟢 Clássica - R$ 30,00
🟡 Ouro - R$ 35,00
🔴 Cobra Coral - R$ 20,00

Condições Comerciais:
📦 Pedido mínimo: 1 caixa
💳 Pagamento: 21 dias (boleto)
🚚 Entrega: D+2 dias úteis
🚛 Frete: CIF (por nossa conta)

Também oferecemos amostra gratuita para que vocês conheçam a linha Pindorama.

Quer que eu envie as amostras?

Abraço,
Gustavo${signature}`;
  }

  if (text.includes('visita') || text.includes('agendar') || text.includes('ir até') || text.includes('ver pessoalmente') || text.includes('passar')) {
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

  if (text.includes('não tenho interesse') || text.includes('não nos interessa') || text.includes('não faremos') || text.includes('obrigado mas') || text.includes('não vamos') || text.includes('não pretendo')) {
    return `Olá,

Entendo perfeitamente! Obrigado pela atenção.

Caso mude de ideia no futuro, estou à disposição. Uma ótima semana!

Abraço,
Gustavo${signature}`;
  }

  if (text.includes('como é feita') || text.includes('produção') || text.includes('ingredientes') || text.includes('sobre a cachaça') || text.includes('mais sobre') || text.includes('história')) {
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

  // Interesse confirmado em receber algo
  if (text.includes('sim, pode') || text.includes('sim, quero') || text.includes('sim, gostaria') || text.includes('pode mandar') || text.includes('pode enviar')) {
    if (lead) lead.askedCadastro = true;
    return `Olá,

Ficamos muito felizes com seu interesse!

Gostaria de oferecer uma amostra gratuita da nossa linha para que vocês conheçam a qualidade Pindorama.

Para envio das amostras, preciso dos seguintes dados cadastrais para emissão da NF de Amostra (gratuita):

• Razão Social
• CNPJ
• Endereço completo (rua, número, bairro, cidade, CEP)
• Nome para contato

Assim que receber os dados, envio as amostras.

Abraço,
Gustavo${signature}`;
  }

  return null;
}

function checkEmails() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('Erro ao abrir inbox:', err);
          imap.end();
          reject(err);
          return;
        }

        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            console.error('Erro ao buscar emails:', err);
            imap.end();
            reject(err);
            return;
          }

          if (results.length === 0) {
            console.log('📭 Nenhum email novo');
            imap.end();
            resolve();
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
                  processedCount++;
                  if (processedCount >= results.length) imap.end();
                  return;
                }

                const from = parsed.from?.text || '';
                const subject = parsed.subject || '';
                const body = parsed.text || '';

                console.log(`\n📧 De: ${from}`);
                console.log(`📋 Assunto: ${subject}`);

                const fromAddr = (parsed.from?.value?.[0]?.address || '').toLowerCase();
                const domain = fromAddr.split('@')[1] || '';
                const lead = leads.find(l => {
                  const leadEmail = l.email.toLowerCase();
                  const leadDomain = leadEmail.split('@')[1] || '';
                  return fromAddr === leadEmail ||
                         domain === leadDomain ||
                         fromAddr.includes(leadEmail.split('@')[0]) ||
                         from.toLowerCase().includes(leadEmail);
                });

                if (!lead) {
                  console.log('⚠️ Email não é de um lead conhecido, ignorando');
                  processedCount++;
                  if (processedCount >= results.length) imap.end();
                  return;
                }

                console.log(`✅ Lead identificado: ${lead.name}`);

                const response = getResponse(subject, body, lead);

                if (!response) {
                  console.log(`❓ Não sei responder este email de ${lead.name}`);
                  console.log(`📩 Mensagem: ${body.substring(0, 200)}...`);
                  processedCount++;
                  if (processedCount >= results.length) imap.end();
                  return;
                }

                try {
                  await transporter.sendMail({
                    from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
                    to: fromAddr || lead.email,
                    subject: `Re: ${subject}`,
                    text: response,
                  });
                  console.log(`✅ Resposta automática enviada para ${lead.name}`);

                  lead.responded = true;
                  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); lead.responseDate = d.toISOString().split('T')[0];
                  writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
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
            reject(err);
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('Erro IMAP:', err);
      reject(err);
    });

    imap.connect();
  });
}

// Verificar a cada 2 minutos
console.log('🤖 Monitor de emails automático iniciado!');
console.log('🔍 Verificando emails a cada 2 minutos...');
console.log('📧 Responderá automaticamente leads conhecidos');
console.log('❓ Não souber responder, avisa no console\n');

async function monitor() {
  while (true) {
    try {
      await checkEmails();
    } catch (error) {
      console.error('Erro na verificação:', error.message);
    }
    await new Promise(r => setTimeout(r, 120000)); // 2 minutos
  }
}

monitor();
