const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const filePath = path.join(__dirname, 'hero-animation.gif');
const fileData = fs.readFileSync(filePath);

// Try using freeimage.host
const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

const parts = [];
parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="source"\r\n\r\nbase64`);
parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\nfile`);
parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="action"\r\n\r\nupload`);
parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n6d207e02198a847aa98d0a2a901485a5`);
parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njson`);

const base64Data = fileData.toString('base64');
parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="hero-animation.gif"\r\nContent-Type: image/gif\r\n\r\n${base64Data}`);
parts.push(`--${boundary}--\r\n`);

const body = parts.join('\r\n');

const options = {
  hostname: 'freeimage.host',
  port: 80,
  path: '/api/1/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json && json.image && json.image.url) {
        console.log('URL:', json.image.url);
      } else {
        console.log('Response:', data.substring(0, 500));
      }
    } catch(e) {
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(body);
req.end();
