const fs = require('fs');
const https = require('https');
const path = require('path');

const filePath = path.join(__dirname, 'hero-animation.gif');
const fileData = fs.readFileSync(filePath);
const base64Data = fileData.toString('base64');

const postData = `key=6d207e02198a847aa98d0a2a901485a5&source=data:image/gif;base64,${base64Data}&format=json`;

const options = {
  hostname: 'freeimage.host',
  port: 443,
  path: '/api/1/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
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

req.write(postData);
req.end();
