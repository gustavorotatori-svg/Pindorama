import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import QRCode from 'qrcode';
import { execSync } from 'child_process';

const SESSION_DIR = join(process.cwd(), '.baileys_auth');
let sock = null;
let ready = false;
let connectPromise = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 6;

function openBrowser(file) {
  try {
    execSync(`start "" "${file}"`, { shell: 'cmd.exe', timeout: 2000 });
  } catch(e) {}
}

let qrCount = 0;
let browserOpened = false;

function scheduleReconnect() {
  if (reconnectTimer || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
  const delay = Math.min(2000 * (2 ** reconnectAttempts), 30000);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect().catch((error) => console.error('Falha ao reconectar WhatsApp:', error.message));
  }, delay);
}

async function startConnection() {
  if (sock && ready) return sock;

  if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Pindorama', 'Chrome', '1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrCount++;
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 400, margin: 2 });
        const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>WhatsApp Pindorama — QR Code</title>
<style>
body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f2f5;font-family:sans-serif;margin:0}
.box{background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1);text-align:center;max-width:420px}
h2{color:#1a1a2e;margin:0 0 8px}
p{color:#555;line-height:1.5;margin:8px 0}
img{border-radius:8px;width:300px;height:300px;display:block;margin:16px auto}
.footer{color:#999;font-size:12px}
.urgente{color:#e65100;font-weight:bold;font-size:14px}
</style>
<meta http-equiv="refresh" content="5">
</head>
<body>
<div class="box">
<h2>WhatsApp Pindorama</h2>
<p class="urgente">QR Code atualizado! Escaneie agora</p>
<p>Abra o WhatsApp no celular:<br><strong>Menu &gt; WhatsApp Web &gt; Escaneie</strong></p>
<img src="${dataUrl}" alt="QR Code" />
<p class="footer">Conectando como (11) 91357-7900</p>
<p class="footer">Auto-refresh a cada 5s — QR #${qrCount}</p>
</div>
</body></html>`;
        writeFileSync('whatsapp-qr.html', html);
        console.log('QR Code #' + qrCount + ' gerado — abrindo navegador...');
        if (!browserOpened) { browserOpened = true; openBrowser('whatsapp-qr.html'); }
      } catch(e) {
        console.log('Erro QR:', e.message);
      }
    }

    if (connection === 'close') {
      ready = false;
      sock = null;
      const statusCode = lastDisconnect?.error?.output?.statusCode ?? lastDisconnect?.error?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) scheduleReconnect();
    }

    if (connection === 'open') {
      ready = true;
      reconnectAttempts = 0;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      console.log('WhatsApp conectado!');
      try { writeFileSync('.whatsapp-ready', 'ok'); } catch(e) {}
      // Write success HTML
      const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WhatsApp Conectado</title><style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#e8f5e9;font-family:sans-serif}.box{background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1);text-align:center}h2{color:#2e7d32}</style></head><body><div class="box"><h2>WhatsApp Conectado!</h2><p>Pindorama agora pode enviar mensagens</p></div></body></html>';
      writeFileSync('whatsapp-qr.html', html);
      openBrowser('whatsapp-qr.html');
    }
  });

  return new Promise((resolve, reject) => {
    const check = setInterval(() => {
      if (ready) { clearInterval(check); resolve(sock); }
    }, 500);
    setTimeout(() => {
      clearInterval(check);
      if (!ready) reject(new Error('WhatsApp nao conectou em 90 segundos.'));
    }, 90000);
  });
}

export async function connect() {
  if (sock && ready) return sock;
  if (connectPromise) return connectPromise;
  connectPromise = startConnection();
  try { return await connectPromise; }
  finally { connectPromise = null; }
}

export async function sendText(to, message) {
  if (!sock) throw new Error('WhatsApp nao iniciado');
  const jid = to.includes('@s.whatsapp.net') ? to : to.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  const sent = await sock.sendMessage(jid, { text: message });
  return sent;
}

export async function sendWhatsApp(phone, name, messageTemplate) {
  const msg = messageTemplate.replace(/{nome}/g, name);
  return await sendText(phone, msg);
}

export function isConnected() { return ready; }

if (process.argv[2] === '--connect') {
  console.log('Iniciando WhatsApp Pindorama... QR sera aberto no navegador');
  connect();
}
