import Imap from 'imap';
import { simpleParser } from 'mailparser';
const imap = new Imap({user:'cachaca011pindorama@gmail.com',password:'wnau jrrr rjpc zuuv',host:'imap.gmail.com',port:993,tls:true,tlsOptions:{rejectUnauthorized:false}});
imap.once('ready', () => {
  imap.openBox('INBOX', false, (err) => {
    if (err) { console.error(err); imap.end(); return; }
    imap.search(['UNSEEN'], (err, results) => {
      if (err) { console.error(err); imap.end(); return; }
      if (!results.length) { console.log('Nenhum novo'); imap.end(); return; }
      const fetch = imap.fetch(results, { bodies: '' });
      let c = 0;
      fetch.on('message', (msg) => {
        msg.on('body', (stream) => {
          simpleParser(stream, (err, parsed) => {
            if (err) return;
            const from = parsed.from?.value?.[0]?.address || '';
            const subj = parsed.subject || '';
            if (from === 'mailer-daemon@googlemail.com') {
              const text = parsed.text || '';
              const m = text.match(/n\u00e3o foi entregue para ([^\s]+)/);
              if (m) console.log('BOUNCE: ' + m[1]);
            } else if (from === 'patricia@mirogastronomia.com.br') {
              console.log('PATRICIA: ' + (parsed.text || '').substring(0, 300));
            }
            c++;
            if (c >= results.length) imap.end();
          });
        });
      });
      fetch.once('error', (e) => { console.error(e); imap.end(); });
    });
  });
});
imap.once('error', console.error);
imap.connect();
