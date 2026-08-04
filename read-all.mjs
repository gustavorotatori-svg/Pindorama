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

async function readPending() {
  await openInbox();

  const all = await searchEmails(['ALL']);
  console.log(`Total: ${all.length}`);
  console.log(`UIDs: ${JSON.stringify(all)}`);

  // Fetch each one by one
  for (const uid of all) {
    await new Promise((resolve, reject) => {
      const f = imap.fetch(uid, { bodies: '' });
      f.on('message', (msg) => {
        msg.on('body', (stream) => {
          simpleParser(stream, (err, parsed) => {
            if (!err) {
              const from = parsed.from?.text || 'unknown';
              const subject = parsed.subject || 'no subject';
              const date = parsed.date?.toISOString() || '';
              console.log(`\nUID ${uid}: ${from} | ${subject}`);
              if (from.includes('patricia') || from.includes('cabrini') || from.includes('mirogastronomia')) {
                console.log(`=== CONTEÚDO ===`);
                console.log(parsed.text?.substring(0, 1000) || '(no text)');
              }
            }
            resolve();
          });
        });
      });
      f.once('error', (err) => { console.log(`UID ${uid} error: ${err.message}`); resolve(); });
      f.once('end', resolve);
    });
  }

  imap.end();
}

readPending();
