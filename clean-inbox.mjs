import Imap from 'imap';

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

function addFlags(uids, flags) {
  return new Promise((resolve, reject) => {
    imap.addFlags(uids, flags, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function cleanInbox() {
  try {
    await openInbox();
    console.log('=== LIMPEZA DA INBOX ===\n');

    // Buscar todos os emails
    const allEmails = await searchEmails(['ALL']);
    console.log(`Total na inbox: ${allEmails.length}`);

    // Buscar bounces (do mailer-daemon)
    const bounces = await searchEmails([['FROM', 'mailer-daemon@googlemail.com']]);
    console.log(`Bounces (mailer-daemon): ${bounces.length}`);

    // Buscar undeliverable (do postmaster)
    const undeliverable = await searchEmails([['FROM', 'postmaster']]);
    console.log(`Undeliverable (postmaster): ${undeliverable.length}`);

    // Marcar todos como lidos e mover para lixo
    const allToDelete = [...new Set([...bounces, ...undeliverable])];
    
    if (allToDelete.length > 0) {
      console.log(`\nMarcando ${allToDelete.length} emails como TRASH...`);
      await addFlags(allToDelete, ['\\Deleted']);
      
      // Expungir
      await new Promise((resolve, reject) => {
        imap.expunge((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log(`✅ ${allToDelete.length} emails movidos para lixo`);
    } else {
      console.log('Nenhum bounce para limpar');
    }

    // Status final
    const remaining = await searchEmails(['ALL']);
    console.log(`\nEmails restantes na inbox: ${remaining.length}`);

    imap.end();
  } catch (err) {
    console.error('Erro:', err.message);
    imap.end();
  }
}

cleanInbox();
