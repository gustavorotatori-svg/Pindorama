import Imap from 'imap';

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
  imap.openBox('INBOX', false, (err) => {
    if (err) { console.error(err); imap.end(); return; }
    imap.search(['UNSEEN'], (err, results) => {
      if (err) { console.error(err); imap.end(); return; }
      console.log('Antes - Unseen:', results);
      if (!results.length) { imap.end(); return; }
      imap.addFlags(results, ['\\Seen'], (err) => {
        if (err) { console.error('addFlags:', err); imap.end(); return; }
        setTimeout(() => {
          imap.search(['UNSEEN'], (err2, after) => {
            console.log('Depois - Unseen:', err2 ? 'erro ' + err2 : after);
            imap.end();
          });
        }, 2000);
      });
    });
  });
});
imap.once('error', (err) => console.error('IMAP:', err));
imap.connect();
