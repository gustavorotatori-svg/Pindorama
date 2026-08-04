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
      imap.openBox('INBOX', false, (err, box) => {
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

function fetchEmail(uid) {
  return new Promise((resolve, reject) => {
    const f = imap.fetch(uid, { bodies: '', markSeen: false });
    f.on('message', (msg) => {
      msg.on('body', (stream) => {
        simpleParser(stream, (err, parsed) => {
          if (err) reject(err);
          else resolve(parsed);
        });
      });
    });
    f.once('error', reject);
    f.once('end', () => reject(new Error('Not found')));
  });
}

async function readLatestResponse() {
  await openInbox();

  // Get ALL emails from the past day to find Patricia's
  const _d = new Date(); _d.setMinutes(_d.getMinutes() - _d.getTimezoneOffset()); const today = _d.toISOString().split('T')[0];
  const allEmails = await searchEmails(['ALL']);
  console.log(`Total emails na inbox: ${allEmails.length}`);
  
  if (allEmails.length === 0) { imap.end(); return; }

  // Fetch the last 5 emails
  const recent = allEmails.slice(-10);
  for (const id of recent) {
    try {
      const email = await fetchEmail(id);
      const from = email.from?.text || '';
      const subject = email.subject || '';
      console.log(`\n--- EMAIL (UID: ${id}) ---`);
      console.log(`De: ${from}`);
      console.log(`Assunto: ${subject}`);
      if (from.toLowerCase().includes('patricia') || from.includes('mirogastronomia') || from.includes('cabrini')) {
        console.log(`\n--- CONTEÚDO ---`);
        console.log(email.text?.substring(0, 1000) || '(sem texto)');
      }
    } catch(e) {
      console.log(`Erro no UID ${id}: ${e.message}`);
    }
  }

  imap.end();
}

readLatestResponse().catch(err => {
  console.error('Erro:', err.message);
  imap.end();
});
