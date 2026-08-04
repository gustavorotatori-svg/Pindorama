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
    imap.addFlags([98], ['\\Seen'], (err) => {
      console.log(err ? 'Erro: ' + err : 'UID 98 marcado como lido');
      imap.end();
    });
  });
});
imap.once('error', (err) => console.error('IMAP:', err));
imap.connect();
