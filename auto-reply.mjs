import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { sendWithinEmailQuota } from './email-quota.mjs';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const leadsPath = join(process.cwd(), 'leads.json');
const qualifiedPath = join(process.cwd(), 'leads-qualificados.json');
const suppressedPath = join(process.cwd(), 'suppressed-emails.json');
const oldLeads = JSON.parse(readFileSync(leadsPath, 'utf8'));
const qualLeads = JSON.parse(readFileSync(qualifiedPath, 'utf8'));
const leads = oldLeads.concat(qualLeads);
const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;

if (!MAIL_USER || !MAIL_PASS) {
  throw new Error('GMAIL_USER e GMAIL_APP_PASSWORD sao obrigatorios');
}

function loadSuppressed() {
  if (!existsSync(suppressedPath)) return [];
  const value = JSON.parse(readFileSync(suppressedPath, 'utf8'));
  return Array.isArray(value) ? value : [];
}

function isDeliveryFailure(from, subject) {
  const value = `${from} ${subject}`.toLowerCase();
  return value.includes('mailer-daemon') || value.includes('postmaster') ||
    value.includes('delivery status notification') || value.includes('undeliverable');
}

function localToday() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; }

function saveLead(lead) {
  const arr = oldLeads.includes(lead) ? oldLeads : qualLeads;
  const file = oldLeads.includes(lead) ? leadsPath : qualifiedPath;
  writeFileSync(file, JSON.stringify(arr, null, 2));
}

function suppressBouncedLeads(body) {
  const normalizedBody = String(body || '').toLowerCase();
  const bounced = leads.filter((lead) => {
    const email = String(lead.email || '').trim().toLowerCase();
    return email && normalizedBody.includes(email);
  });

  if (bounced.length === 0) return { matched: [], newlySuppressed: [] };

  const suppressed = new Set(loadSuppressed().map((email) => String(email).toLowerCase()));
  const newlySuppressed = [];
  for (const lead of bounced) {
    const email = String(lead.email).trim().toLowerCase();
    if (suppressed.has(email) && lead.doNotContact && lead.bounced) continue;
    suppressed.add(email);
    lead.doNotContact = true;
    lead.bounced = true;
    lead.bounceDate = localToday();
    saveLead(lead);
    newlySuppressed.push(lead);
  }
  if (newlySuppressed.length > 0) {
    writeFileSync(suppressedPath, JSON.stringify([...suppressed].sort(), null, 2) + '\n');
  }
  return { matched: bounced, newlySuppressed };
}

const imapConfig = {
  user: MAIL_USER,
  password: MAIL_PASS,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  connTimeout: 30000,
  authTimeout: 30000,
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

const signature = `
---
Gustavo
Pindorama - Cachaça Artesanal
📧 cachaca011pindorama@gmail.com
📞 (11) 91357-7900
🌐 drinkpindorama.com`;

const INDICATION_HINTS = [
  'não é comigo', 'não é com a gente', 'não é com a empresa', 'não sou eu',
  'quem cuida', 'procure', 'fale com', 'encaminhar', 'encaminhado',
  'outra pessoa', 'outro setor', 'responsável', 'responsavel',
  'segue contato', 'indicar', 'melhor pessoa', 'setor de compras'
];

function getIndicatedEmail(clean, lead) {
  const exclude = new Set([
    (lead.email || '').toLowerCase(),
    String(process.env.GMAIL_USER || '').toLowerCase(),
  ]);
  const found = (clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).map(e => e.toLowerCase());
  return found.find(e => !exclude.has(e)) || null;
}

// Retorna { text, keepUnread, indicatedEmail } para quem respondeu.
function getResponse(subject, body, lead) {
  // Remove quoted text (reply/forward) to avoid matching our own messages
  const clean = body.replace(/^>.*$/gm, '').trim();
  const text = (subject + ' ' + clean).toLowerCase();

  // Cliente indica outro contato (novo ciclo de prospecção)
  if (INDICATION_HINTS.some(h => text.includes(h))) {
    const indicatedEmail = getIndicatedEmail(clean, lead);
    if (indicatedEmail) {
      return {
        text: `Olá,

Obrigado pela indicação! Vou entrar em contato com ${indicatedEmail} para apresentar a Pindorama.

Se precisar de qualquer coisa, estou à disposição.

Abraço,
Gustavo${signature}`,
        keepUnread: false,
        indicatedEmail,
      };
    }
  }

  // Se já pedimos cadastro, não insistir: deixa a thread em análise
  if (lead && lead.askedCadastro) return { text: null, keepUnread: true, indicatedEmail: null };

  // Cliente quer amostra
  if (text.includes('amostra') || text.includes('prova') || text.includes('experimentar') || text.includes('gostaria de receber')) {
    if (lead) lead.askedCadastro = true;
    return {
      text: `Olá,

Ficamos muito felizes com seu interesse!

Para envio das amostras, preciso dos seguintes dados para emissão da NF de Amostra (gratuita):

• Razão Social
• CNPJ
• Endereço completo (rua, número, bairro, cidade, CEP)
• Nome para contato

Assim que receber os dados, envio as amostras para que vocês conheçam a qualidade Pindorama.

Abraço,
Gustavo${signature}`,
      keepUnread: true,
      indicatedEmail: null,
    };
  }

  // Condições comerciais
  if (text.includes('condiç') || text.includes('pagamento') || text.includes('prazo') || text.includes('frete') || text.includes('entrega')) {
    return {
      text: `Olá,

Segue nossas condições comerciais:

📦 Pedido mínimo: 1 caixa
💳 Pagamento: 21 dias (boleto)
🚚 Entrega: D+2 dias úteis após confirmação do pedido
🚛 Frete: CIF (por nossa conta)

Também oferecemos amostra gratuita para que vocês conheçam a linha Pindorama.

Quer que eu envie as amostras?

Abraço,
Gustavo${signature}`,
      keepUnread: false,
      indicatedEmail: null,
    };
  }

  // Preço (tabela estruturada por caixa, fiel à POLITICA_COMERCIAL_ATUAL.md)
  if (text.includes('preço') || text.includes('valor') || text.includes('quanto custa') || text.includes('quanto sai') || text.includes('tabela')) {
    return {
      text: `Olá,

Obrigado pelo interesse!

Segue nossa tabela de preços (atacado, por caixa):

🟢 Clássica 750ml — R$ 84,00 / caixa (6 x 750ml)
🟡 Ouro 700ml — R$ 120,00 / caixa (6 x 700ml)
🔴 Cobra Coral 600ml — R$ 42,00 / caixa (12 x 600ml)

Linha garrafinhas (200ml), preço por unidade:
• Prata 200ml — R$ 30,00
• Ouro 200ml — R$ 35,00
• Cobra Coral 200ml — R$ 20,00

Condições: pedido mínimo de 1 caixa, pagamento em 21 dias, frete CIF e entrega D+2.

Além dos preços, oferecemos aos parceiros: amostra gratuita, degustadoras para ações no seu estabelecimento, treinamento da equipe, bonificação no primeiro pedido. Trabalhamos com margem saudável justamente para valorizar o canal de venda, sem queima de preços.

Quer que eu envie as amostras?

Abraço,
Gustavo${signature}`,
      keepUnread: false,
      indicatedEmail: null,
    };
  }

  // Visita
  if (text.includes('visita') || text.includes('agendar') || text.includes('ir até') || text.includes('ver pessoalmente')) {
    return {
      text: `Olá,

Perfeito! Fico feliz em agendar uma visita.

Por favor, me envie:
• Endereço completo do estabelecimento
• Horários disponíveis
• Nome de quem será o contato

Posso ir qualquer dia da semana, no horário que melhor para vocês.

Abraço,
Gustavo${signature}`,
      keepUnread: false,
      indicatedEmail: null,
    };
  }

  // Não tem interesse / não sabe: só agradecer e ficar à disposição
  if (text.includes('não tenho interesse') || text.includes('não nos interessa') || text.includes('não faremos') || text.includes('obrigado mas')
      || text.includes('não temos interesse') || text.includes('sem interesse') || text.includes('não quero') || text.includes('dispenso')
      || text.includes('não precisa') || text.includes('não é para nós') || text.includes('por enquanto não') || text.includes('não sei')
      || text.includes('não vou querer') || text.includes('não estamos interessados')) {
    return {
      text: `Olá,

Entendo perfeitamente! Obrigado pela atenção.

Caso mude de ideia no futuro, estou à disposição. Uma ótima semana!

Abraço,
Gustavo${signature}`,
      keepUnread: false,
      indicatedEmail: null,
    };
  }

  // Sobre a cachaça
  if (text.includes('como é feita') || text.includes('produção') || text.includes('ingredientes') || text.includes('sobre a cachaça') || text.includes('mais sobre')) {
    return {
      text: `Olá,

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
Gustavo${signature}`,
      keepUnread: false,
      indicatedEmail: null,
    };
  }

  // Resposta padrão (não sabe responder): deixa em análise
  return { text: null, keepUnread: true, indicatedEmail: null };
}

async function addIndicatedLead(indicatedEmail, fromLead) {
  const email = indicatedEmail.toLowerCase();
  const existing = leads.find(l => (l.email || '').toLowerCase() === email);
  if (existing) {
    console.log(`⏭️ Indicado ${email} JA EXISTE (${existing.name}) — não duplicado`);
    return null;
  }
  let mxOk = false;
  try {
    const domain = email.split('@')[1] || '';
    const recs = await dns.promises.resolveMx(domain);
    mxOk = recs && recs.length > 0;
  } catch { mxOk = false; }

  const novo = {
    name: `Indicado por ${fromLead.name}`,
    email,
    neighborhood: fromLead.neighborhood || '',
    type: fromLead.type || 'comercio_bebidas',
    address: fromLead.address || '',
    context: `Indicado por ${fromLead.name} (${fromLead.email}) em ${localToday()} — novo ciclo de prospeccao`,
    template: 'consultivo',
    emailVerified: mxOk,
    emailSource: 'indicacao',
    emailVerifiedAt: mxOk ? localToday() : undefined,
    date: mxOk ? localToday() : undefined,
  };
  qualLeads.push(novo);
  writeFileSync(qualifiedPath, JSON.stringify(qualLeads, null, 2));
  console.log(`🆕 NOVO LEAD (indicacao): ${novo.name} <${email}> MX=${mxOk ? 'ok' : 'sem'} — entrará no próximo ciclo de email1`);
  return novo;
}

function checkEmails(attempt = 1) {
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
        const uidsToMarkSeen = [];

        const finish = () => {
          if (processedCount >= results.length) {
            if (uidsToMarkSeen.length > 0) {
              imap.addFlags(uidsToMarkSeen, ['\\Seen'], (flagsErr) => {
                if (flagsErr) console.error('Erro ao marcar como lido:', flagsErr);
                imap.end();
              });
            } else {
              imap.end();
            }
          }
        };

        fetch.on('message', (msg) => {
          let msgUid = null;
          msg.once('attributes', (attrs) => { msgUid = attrs.uid; });

          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                console.error('Erro ao parsear email:', err);
                processedCount++;
                finish();
                return;
              }

              const from = parsed.from?.text || '';
              const subject = parsed.subject || '';
              const body = parsed.text || '';

              if (isDeliveryFailure(from, subject)) {
                const bounceResult = suppressBouncedLeads(`${body}\n${parsed.html || ''}`);
                if (bounceResult.newlySuppressed.length > 0) {
                  console.log(`BOUNCE SUPRIMIDO: ${bounceResult.newlySuppressed.map((item) => `${item.name} <${item.email}>`).join(', ')}`);
                } else if (bounceResult.matched.length > 0) {
                  console.log(`BOUNCE JA SUPRIMIDO: ${bounceResult.matched.map((item) => `${item.name} <${item.email}>`).join(', ')}`);
                } else {
                  console.log('BOUNCE SEM DESTINATARIO CONHECIDO: requer auditoria manual do DSN');
                }
                if (msgUid) uidsToMarkSeen.push(msgUid);
                processedCount++;
                finish();
                return;
              }

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
                if (msgUid) uidsToMarkSeen.push(msgUid);
                processedCount++;
                finish();
                return;
              }

              console.log(`✅ Lead identificado: ${lead.name}`);

              // Não re-responder leads já tratados
              if (lead.responded) {
                console.log(`↩️ ${lead.name} já foi respondido, pulando`);
                if (msgUid) uidsToMarkSeen.push(msgUid);
                processedCount++;
                finish();
                return;
              }

              // Gerar resposta
              const response = getResponse(subject, body, lead);

              if (!response || !response.text) {
                console.log(`❓ Não sei responder este email de ${lead.name} — deixado NAO LIDO para analise`);
                console.log(`📩 Mensagem: ${body.substring(0, 200)}...`);
                processedCount++;
                finish();
                return;
              }

              // Nova indicação de contato: iniciar novo ciclo de prospecção
              if (response.indicatedEmail) {
                await addIndicatedLead(response.indicatedEmail, lead);
              }

                // Enviar resposta (usar email do remetente, não o cadastrado)
              try {
                const quotaResult = await sendWithinEmailQuota(() => transporter.sendMail({
                    from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
                    to: fromAddr || lead.email,
                    subject: `Re: ${subject}`,
                    text: response.text,
                  }));
                if (!quotaResult.sent) {
                  console.log(`Quota global atingida; resposta para ${lead.name} ficou pendente (email fica NAO LIDO).`);
                  processedCount++;
                  finish();
                  return;
                }
                console.log(`✅ Resposta automática enviada para ${lead.name}`);

                // Atualizar lead no arquivo correto
                lead.responded = true;
                lead.responseDate = localToday();
                saveLead(lead);

                // Amostra: manter thread NAO LIDA para acompanhamento do usuário
                if (response.keepUnread) {
                  console.log(`📌 Resposta de amostras deixada NAO LIDA para acompanhamento`);
                } else {
                  if (msgUid) uidsToMarkSeen.push(msgUid);
                }
              } catch (error) {
                console.error(`❌ Erro ao enviar resposta: ${error.message}`);
              }

              processedCount++;
              finish();
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
    if (attempt < 3) {
      const delayMs = attempt * 5000;
      console.log(`RETRY IMAP: tentativa ${attempt + 1}/3 em ${delayMs / 1000}s`);
      setTimeout(() => checkEmails(attempt + 1), delayMs);
      return;
    }
    console.error('ERRO IMAP PERSISTENTE: 3 tentativas sem autenticar; workflow marcado como falha.');
    process.exitCode = 1;
  });

  imap.connect();
}

// Executar verificação
console.log('🔍 Verificando emails...');
checkEmails();
