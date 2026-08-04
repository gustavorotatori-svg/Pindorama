import { connect, sendText, isConnected } from './whatsapp.mjs';

const MSG = `Olá Ghirag! Aqui é o Gustavo da Pindorama. Vi que você está animada com a nossa linha — para emitirmos a NF da amostra gratuita (Clássica, Ouro e Cobra Coral), só preciso do cadastro: Razão Social, CNPJ, Endereço completo e um contato. Pode me passar por aqui?`;

const sock = await connect();
if (!sock) { console.log('FALHA: nao conectou ao WhatsApp'); process.exit(1); }

const deadline = Date.now() + 120000;
while (!isConnected() && Date.now() < deadline) {
  await new Promise(r => setTimeout(r, 2000));
}
if (!isConnected()) { console.log('FALHA: tempo esgotado sem conexao'); process.exit(1); }

const num = '5511956662244';
const res = await sock.onWhatsApp(num);
const exists = Array.isArray(res) && res.some(r => r.exists);
if (!exists) { console.log('SEM WHATSAPP: Degusti'); process.exit(0); }

await sendText(num + '@s.whatsapp.net', MSG);
console.log('ENVIADO para Degusti (11) 95666-2244');
process.exit(0);
