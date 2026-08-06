import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { writeFileSync } from 'fs';
import QRCode from 'qrcode';

const qrPath = 'whatsapp-qr.html';
let connected = false;

const { state, saveCreds } = await useMultiFileAuthState('.baileys_auth');
const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ['Pindorama', 'Chrome', '1.0'] });
sock.ev.on('creds.update', saveCreds);

sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
  if (qr) {
    try {
      const dataUrl = await QRCode.toDataURL(qr, { width: 400, margin: 2 });
      const html = '<html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="5"></head><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f2f5"><div style="text-align:center"><h2>WhatsApp Pindorama</h2><p style="color:#e65100"><b>Escaneie no celular: WhatsApp &gt; Aparelhos conectados</b></p><img src="' + dataUrl + '" width="300"/></div></body></html>';
      writeFileSync(qrPath, html);
      console.log('[QR] gerado - ' + new Date().toISOString());
    } catch (e) { console.log('[QR-ERR] ' + e.message); }
  }
  if (connection === 'open') {
    connected = true;
    console.log('[CONECTADO] WhatsApp pareado! (11) 91357-7900');
    try { writeFileSync(qrPath, '<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh"><h2 style="color:green">WhatsApp Conectado!</h2></body></html>'); } catch (e) {}
    process.exit(0);
  }
  if (connection === 'close' && lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
    console.log('[LOGGED OUT] sessao encerrada no celular - QR novo gerado, escaneie');
  }
});

while (!connected) { await new Promise(r => setTimeout(r, 2000)); }
