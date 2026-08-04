import Imap from 'imap';

const imapConfig = {
  user: 'cachaca011pindorama@gmail.com',
  password: 'wnau jrrr rjpc zuuv',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

const target = process.argv[2];
const imap = new Imap(imapConfig);
imap.once('ready', () => {
  imap.openBox('INBOX', false, (err) => {
    if (err) { console.error(err); imap.end(); return; }
    imap.search(['UNSEEN'], (err, results) => {
      if (err) { console.error(err); imap.end(); return; }
      const uids = results.filter((uid) => String(uid) === String(target));
      if (!uids.length) { console.log('UID ' + target + ' não está mais como não-lido'); imap.end(); return; }
      const fetch = imap.fetch(uids, { bodies: 'TEXT', markSeen: false });
      fetch.on('message', (msg) => {
        msg.on('body', (stream) => {
          let buf = '';
          stream.on('data', (c) => (buf += c.toString('utf8')));
          stream.on('end', () => {
            const clean = buf.replace(/\r/g, '').replace(/=\r?\n/g, '');
            console.log('=== BODY UID ' + target + ' ===');
            console.log(clean.slice(0, 6000));
          });
        });
      });
      fetch.once('end', () => imap.end());
      fetch.once('error', (e) => { console.error(e); imap.end(); });
    });
  });
});
imap.once('error', (err) => console.error('IMAP:', err));
imap.connect();
