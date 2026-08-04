import Imap from 'imap';
import { simpleParser } from 'mailparser';

const imap = new Imap({
  user: 'cachaca011pindorama@gmail.com',
  password: 'wnau jrrr rjpc zuuv',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

function openInbox() {
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) reject(err);
        else resolve(box);
      });
    });
    imap.once('error', reject);
    imap.connect();
  });
}

function searchEmails(criteria) {
  return new Promise((resolve, reject) => {
    imap.search(criteria, (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

function fetchEmails(uids) {
  return new Promise((resolve, reject) => {
    if (!uids || uids.length === 0) { resolve([]); return; }
    const emails = [];
    let pending = uids.length;
    const f = imap.fetch(uids, { bodies: '', markSeen: false });
    f.on('message', (msg) => {
      msg.on('body', (stream) => {
        simpleParser(stream, (err, parsed) => {
          if (!err) emails.push({
            from: parsed.from?.text || '',
            to: parsed.to?.text || '',
            subject: parsed.subject || '',
            date: parsed.date?.toISOString() || '',
            text: (parsed.text || '').substring(0, 800),
          });
          pending--;
          if (pending === 0) resolve(emails);
        });
      });
    });
    f.once('error', reject);
    f.once('end', () => { if (pending === 0) resolve(emails); });
  });
}

async function audit() {
  try {
    await openInbox();
    console.log('=== AUDITORIA COMPLETA DE CAIXA DE ENTRADA ===\n');

    // All emails in inbox
    const allEmails = await searchEmails(['ALL']);
    console.log(`Total de emails na inbox: ${allEmails.length}\n`);

    // Fetch ALL inbox emails
    const emails = await fetchEmails(allEmails);

    // Filter: only emails NOT from us (not from cachaca011pindorama)
    const responses = emails.filter(e => !e.from.includes('cachaca011pindorama'));
    const bounces = emails.filter(e => e.from.includes('mailer-daemon') || e.from.includes('postmaster') || e.subject.includes('delivery') || e.subject.includes('failure') || e.subject.includes('undeliverable'));
    const autoReplies = responses.filter(e => e.subject.toLowerCase().includes('auto') || e.subject.toLowerCase().includes('resposta automática') || e.subject.toLowerCase().includes('ausência') || e.text.toLowerCase().includes('resposta automática') || e.text.toLowerCase().includes('fora do escritório') || e.text.toLowerCase().includes('estou ausente'));
    const realResponses = responses.filter(e => !bounces.includes(e) && !autoReplies.includes(e));

    console.log(`=== RESUMO ===`);
    console.log(`Total recebido: ${emails.length}`);
    console.log(`Respostas (fora de nós): ${responses.length}`);
    console.log(`Bounces/Falhas: ${bounces.length}`);
    console.log(`Respostas automáticas: ${autoReplies.length}`);
    console.log(`Respostas REAIS: ${realResponses.length}`);
    console.log(`Taxa de resposta: ${responses.length > 0 ? ((responses.length / 125) * 100).toFixed(1) : '0'}%`);

    if (bounces.length > 0) {
      console.log(`\n=== BOUNCES/FAILURES ===`);
      for (const b of bounces) {
        console.log(`ASSUNTO: ${b.subject}`);
        console.log(`DE: ${b.from}`);
        console.log(`TEXTO: ${b.text.substring(0, 400)}`);
        console.log('---');
      }
    }

    if (autoReplies.length > 0) {
      console.log(`\n=== RESPOSTAS AUTOMATICAS ===`);
      for (const a of autoReplies) {
        console.log(`DE: ${a.from}`);
        console.log(`ASSUNTO: ${a.subject}`);
        console.log(`TEXTO: ${a.text.substring(0, 400)}`);
        console.log('---');
      }
    }

    if (realResponses.length > 0) {
      console.log(`\n=== RESPOSTAS REAIS ===`);
      for (const r of realResponses) {
        console.log(`DE: ${r.from}`);
        console.log(`ASSUNTO: ${r.subject}`);
        console.log(`DATA: ${r.date}`);
        console.log(`TEXTO: ${r.text.substring(0, 600)}`);
        console.log('---');
      }
    } else {
      console.log(`\n⚠️ NENHUMA RESPOSTA REAL RECEBIDA DEPOIS DE 125 EMAILS ENVIADOS`);
    }

    // Also list ALL emails for debugging
    console.log(`\n=== TODOS OS EMAILS NA INBOX (para debug) ===`);
    for (const e of emails) {
      console.log(`${e.date} | DE: ${e.from.substring(0, 60)} | ASSUNTO: ${e.subject.substring(0, 60)}`);
    }

    imap.end();
  } catch (err) {
    console.error('Erro:', err.message);
    imap.end();
  }
}

audit();
