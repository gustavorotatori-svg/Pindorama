import Imap from 'imap';
import { simpleParser } from 'mailparser';

const imap = new Imap({
  user: process.env.GMAIL_USER,
  password: process.env.GMAIL_APP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  connTimeout: 30000,
  authTimeout: 30000,
});

const connect = () => new Promise((resolve, reject) => {
  imap.once('ready', resolve);
  imap.once('error', reject);
  imap.connect();
});
const boxes = () => new Promise((resolve, reject) => imap.getBoxes((error, value) => error ? reject(error) : resolve(value)));
const open = (name) => new Promise((resolve, reject) => imap.openBox(name, true, (error, value) => error ? reject(error) : resolve(value)));
const search = (criteria) => new Promise((resolve, reject) => imap.search(criteria, (error, value) => error ? reject(error) : resolve(value)));
const fetchParsed = (uids) => new Promise((resolve, reject) => {
  if (!uids.length) return resolve([]);
  const pending = [];
  const request = imap.fetch(uids, { bodies: '', markSeen: false });
  request.on('message', message => message.on('body', stream => pending.push(simpleParser(stream))));
  request.once('error', reject);
  request.once('end', async () => resolve(await Promise.all(pending)));
});

function flatten(tree, prefix = '') {
  const result = [];
  for (const [name, value] of Object.entries(tree)) {
    const full = prefix ? `${prefix}${value.delimiter}${name}` : name;
    result.push({ name: full, attribs: value.attribs || [] });
    if (value.children) result.push(...flatten(value.children, full));
  }
  return result;
}

await connect();
const allBoxes = flatten(await boxes());
const sentBox = allBoxes.find(box => box.attribs.includes('\\Sent'))?.name;
const allMailBox = allBoxes.find(box => box.attribs.includes('\\All'))?.name;
const since = new Date(Date.now() - 3 * 86400000);

await open(allMailBox);
const deliveryMatches = await search([['X-GM-RAW', 'newer_than:3d (mantequilla OR "Delivery Status Notification" OR "message delayed" OR "mensagem atrasada")']]);
const delivery = (await fetchParsed(deliveryMatches)).map(message => ({
  date: message.date?.toISOString(),
  from: message.from?.text,
  to: message.to?.text,
  subject: message.subject,
  messageId: message.messageId,
  excerpt: String(message.text || '').replace(/\s+/g, ' ').slice(0, 700),
})).sort((a, b) => String(a.date).localeCompare(String(b.date)));
const mantequillaMatches = await search([['X-GM-RAW', 'newer_than:7d mantequilla']]);
const mantequilla = (await fetchParsed(mantequillaMatches)).map(message => ({
  date: message.date?.toISOString(),
  from: message.from?.text,
  to: message.to?.text,
  subject: message.subject,
  messageId: message.messageId,
  excerpt: String(message.text || '').replace(/\s+/g, ' ').slice(0, 900),
})).sort((a, b) => String(a.date).localeCompare(String(b.date)));

await open(sentBox);
const sent = await fetchParsed(await search([['SINCE', new Date(Date.now() - 2 * 86400000)]]));
const cutoff = Date.now() - 86400000;
const sent24h = sent.filter(message => message.date && message.date.getTime() >= cutoff).map(message => ({
  date: message.date.toISOString(),
  to: message.to?.text,
  subject: message.subject,
  messageId: message.messageId,
})).sort((a, b) => String(a.date).localeCompare(String(b.date)));

console.log(JSON.stringify({ sentBox, allMailBox, delivery, mantequilla, sent24hCount: sent24h.length, sent24h }, null, 2));
imap.end();
