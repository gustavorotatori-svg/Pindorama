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
      console.log('Unseen UIDs:', results);
      const fetch = imap.fetch(results, { bodies: '', markSeen: false, struct: false });
      fetch.on('message', (msg, seqno) => {
        msg.on('body', (stream, info) => {
          let buf = '';
          stream.on('data', (c) => (buf += c.toString('utf8')));
          stream.on('end', () => {
            console.log('\n=== SEQ ' + seqno + ' ===');
            console.log(buf.replace(/\r/g, '').slice(0, 4000));
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
