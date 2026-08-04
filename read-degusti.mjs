import Imap from 'imap';
import { simpleParser } from 'mailparser';

const imapConfig = {
  user: 'cachaca011pindorama@gmail.com',
  password: 'wnau jrrr rjpc zuuv',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

const imap = new Imap(imapConfig);
imap.once('ready', () => {
  imap.openBox('INBOX', false, (err, box) => {
    if (err) { console.error(err); imap.end(); return; }
    imap.search(['UNSEEN'], (err, results) => {
      if (err) { console.error(err); imap.end(); return; }
      console.log('Unseen:', results.length);
      if (results.length === 0) { imap.end(); return; }
      const fetch = imap.fetch(results, { bodies: '' });
      fetch.on('message', (msg) => {
        msg.on('body', (stream) => {
          simpleParser(stream, (err, parsed) => {
            if (err) { console.error(err); return; }
            const from = parsed.from?.value?.[0]?.address || '';
            if (from.toLowerCase().includes('degusti')) {
              console.log('FROM:', from);
              console.log('SUBJECT:', parsed.subject);
              console.log('--- TEXT ---');
              console.log(parsed.text);
              console.log('--- HTML (stripped) ---');
              const html = (parsed.html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
              console.log(html.substring(0, 2000));
              imap.end();
            }
          });
        });
      });
      fetch.once('error', (e) => { console.error(e); imap.end(); });
    });
  });
});
imap.once('error', (err) => console.error('IMAP:', err));
imap.connect();
