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
      else resolve(results);
    });
  });
}

function fetchEmails(uids) {
  return new Promise((resolve, reject) => {
    if (!uids || uids.length === 0) { resolve([]); return; }
    const emails = [];
    const f = imap.fetch(uids, { bodies: '', markSeen: false });
    f.on('message', (msg, seqno) => {
      msg.on('body', (stream) => {
        simpleParser(stream, (err, parsed) => {
          if (!err) emails.push({
            from: parsed.from?.text || '',
            subject: parsed.subject || '',
            date: parsed.date?.toISOString() || '',
            text: (parsed.text || '').substring(0, 500),
          });
        });
      });
    });
    f.once('error', reject);
    f.once('end', () => resolve(emails));
  });
}

async function audit() {
  await openInbox();
  console.log('=== AUDITORIA DE CAIXA DE ENTRADA ===\n');

  // All emails in inbox
  const allEmails = await searchEmails(['ALL']);
  console.log(`Total de emails na inbox: ${allEmails.length}\n`);

  // Emails from last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentEmails = await searchEmails([['SINCE', weekAgo]]);
  console.log(`Emails ultimos 7 dias: ${recentEmails.length}\n`);

  // Fetch recent emails
  const emails = await fetchEmails(recentEmails);

  console.log('--- ULTIMOS EMAILS RECEBIDOS ---\n');
  for (const email of emails) {
    console.log(`DE: ${email.from}`);
    console.log(`ASSUNTO: ${email.subject}`);
    console.log(`DATA: ${email.date}`);
    console.log(`CORPO: ${email.text.substring(0, 300)}`);
    console.log('---');
  }

  // Check sent folder
  imap.end();
}

audit().catch(console.error);
