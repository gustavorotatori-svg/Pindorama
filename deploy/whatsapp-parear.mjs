import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import http from 'http';
import QRCode from 'qrcode';
import QRTerm from 'qrcode-terminal';

const SESSION_DIR = join(process.cwd(), '.baileys_auth');
if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });

let qrCount = 0;
let latestHtml = '<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh"><h2>Aguardando QR...</h2></body></html>';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(latestHtml);
});
server.listen(3001, '0.0.0.0', () => {
  console.log('Pagina de QR: http://IP_DA_VM:3001  (abra no navegador do PC)');
  console.log('Libere a porta 3001 no firewall do GCP (regra com tag http-qr)');
});

function connect() {
  const { state, saveCreds } = useMultiFileAuthState(SESSION_DIR);
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ['Pindorama', 'Chrome', '1.0'] });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrCount++;
      QRTerm.generate(qr, { small: true }, (q) => {
        console.log('\n=== QR #' + qrCount + ' — escaneie: WhatsApp > Aparelhos conectados ===\n' + q);
      });
      const dataUrl = await QRCode.toDataURL(qr, { width: 400, margin: 2 });
      latestHtml = '<html><head><meta http-equiv="refresh" content="5"></head><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh"><div style="text-align:center"><h2>WhatsApp Pindorama</h2><p>Escaneie no celular: <b>WhatsApp > Aparelhos conectados</b></p><img src="' + dataUrl + '" width="300" /><p>QR #' + qrCount + '</p></div></body></html>';
    }
    if (connection === 'open') {
      console.log('WHATSAPP CONECTADO (11) 91357-7900! Pareamento salvo em .baileys_auth.');
      latestHtml = '<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh"><h2 style="color:green">WhatsApp Conectado!</h2></body></html>';
      setTimeout(() => process.exit(0), 2000);
    }
    if (connection === 'close') {
      const loggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
      if (loggedOut) {
        console.log('Sessao encerrada no celular. Escaneie o QR de novo.');
      } else {
        console.log('Conexao caiu — reconectando...');
        setTimeout(() => connect(), 5000);
      }
    }
  });
  return sock;
}

connect();
