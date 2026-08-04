import Imap from 'imap';

const imapConfig = {
  user: 'cachaca011pindorama@gmail.com',
  password: 'wnau jrrr rjpc zuuv',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

const uid = Number(process.argv[2] || 0);
const imap = new Imap(imapConfig);
imap.once('ready', () => {
  imap.openBox('INBOX', false, (err) => {
    if (err) { console.error(err); imap.end(); return; }
    const fetch = imap.fetch([uid], { bodies: 'HEADER.FIELDS (FROM SUBJECT)', markSeen: false });
    fetch.on('message', (msg) => {
      msg.on('body', (stream) => {
        let buf = '';
        stream.on('data', (c) => (buf += c.toString('utf8')));
        stream.on('end', () => console.log('EMAIL UID ' + uid + ':\n' + buf.trim()));
      });
    });
    fetch.once('end', () => imap.end());
    fetch.once('error', (e) => { console.error(e); imap.end(); });
  });
});
imap.once('error', (err) => console.error('IMAP:', err));
imap.connect();
