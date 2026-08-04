const fs = require('fs');
const https = require('https');
const path = require('path');

const filePath = path.join(__dirname, 'hero-animation.gif');
const fileData = fs.readFileSync(filePath);

const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

const parts = [];
parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n6d207e02198a847aa98d0a2a901485a5`));
parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njson`));
parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="source"; filename="hero-animation.gif"\r\nContent-Type: image/gif\r\n\r\n`));
parts.push(fileData);
parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

const body = Buffer.concat(parts);

const options = {
  hostname: 'freeimage.host',
  port: 443,
  path: '/api/1/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.image && json.image.url) {
        console.log('SUCCESS! Image URL:', json.image.url);
        console.log('Viewer URL:', json.image.url_viewer);
      } else {
        console.log('Response:', JSON.stringify(json).substring(0, 500));
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
