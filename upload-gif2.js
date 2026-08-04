const fs = require('fs');
const https = require('https');
const path = require('path');

const filePath = path.join(__dirname, 'hero-animation.gif');
const fileData = fs.readFileSync(filePath);

// Try using telegraph
const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

let body = '';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="file"; filename="hero-animation.gif"\r\n`;
body += `Content-Type: image/gif\r\n\r\n`;

const bodyBuffer = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="hero-animation.gif"\r\nContent-Type: image/gif\r\n\r\n`),
  fileData,
  Buffer.from(`\r\n--${boundary}--\r\n`)
]);

const options = {
  hostname: 'telegra.ph',
  port: 443,
  path: '/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': bodyBuffer.length,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 1000));
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(bodyBuffer);
req.end();
