import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { writeFileSync } from 'fs';
import QRCode from 'qrcode';

const qrPath = 'whatsapp-qr.html';

function htmlConnected() {
  return '<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f2f5"><h2 style="color:green">WhatsApp Conectado!</h2></body></html>';
}

function htmlQr(qr) {
  return '<html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="5"></head><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f2f5"><div style="text-align:center"><h2>WhatsApp Pindorama</h2><p style="color:#e65100"><b>Escaneie no celular: WhatsApp &gt; Aparelhos conectados</b></p><img src="' + qr + '" width="300"/></div></body></html>';
}

async function conectar() {
  console.log('[RECONECTANDO] ' + new Date().toISOString());
  const { state, saveCreds } = await useMultiFileAuthState('.baileys_auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ['Pindorama', 'Chrome', '1.0'] });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 400, margin: 2 });
        writeFileSync(qrPath, htmlQr(dataUrl));
        console.log('[QR] gerado - ' + new Date().toISOString());
      } catch (e) { console.log('[QR-ERR] ' + e.message); }
    }
    if (connection === 'open') {
      console.log('[CONECTADO] WhatsApp pareado! (11) 91357-7900 - ' + new Date().toISOString());
      try { writeFileSync(qrPath, htmlConnected()); } catch (e) {}
      process.exit(0);
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const motivo = code === DisconnectReason.loggedOut ? 'LOGGED OUT (sessao encerrada no celular)' : 'erro code=' + code;
      console.log('[CLOSE] ' + motivo + ' - novo QR em 5s - ' + new Date().toISOString());
      await new Promise(r => setTimeout(r, 5000));
      conectar();
    }
  });
}

conectar();
setInterval(() => {}, 1 << 30);
