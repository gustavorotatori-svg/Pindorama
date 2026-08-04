import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';

const imap = new Imap({
  user: 'cachaca011pindorama@gmail.com',
  password: 'wnau jrrr rjpc zuuv',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
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

  // Get unseen/recent emails
  const unseen = await searchEmails([['FROM', 'mirogastronomia.com.br']]);
  
  if (unseen.length === 0) {
    console.log('Nenhum email da Miró Gastronomia encontrado.');
    imap.end();
    return;
  }

  const latest = unseen[unseen.length - 1];
  const email = await fetchEmail(latest);
  
  console.log('=== EMAIL DA PATRICIA CABRINI ===');
  console.log(`De: ${email.from?.text}`);
  console.log(`Assunto: ${email.subject}`);
  console.log(`Data: ${email.date}`);
  console.log(`\n--- CORPO ---\n`);
  console.log(email.text || '(sem texto)');
  console.log(`\n--- HTML (resumo) ---\n`);
  if (email.html) {
    // Strip HTML tags for reading
    const plain = email.html.replace(/<[^>]*>/g, '').trim();
    console.log(plain.substring(0, 1000));
  }
  
  // Also check what we sent to Miró to understand context
  const sentMiro = await searchEmails([['TO', 'reservas@mirogastronomia.com.br']]);
  console.log(`\n--- NOSSO EMAIL ORIGINAL PARA MIRO (ID: ${sentMiro[sentMiro.length-1]}) ---`);
  if (sentMiro.length > 0) {
    const original = await fetchEmail(sentMiro[sentMiro.length - 1]);
    console.log(`Nossa mensagem enviada para reservas@mirogastronomia.com.br`);
    console.log(`Respondida por: ${email.from?.text} (${email.from?.value?.[0]?.address})`);
  }

  imap.end();
}

readLatestResponse().catch(err => {
  console.error('Erro:', err.message);
  imap.end();
});
