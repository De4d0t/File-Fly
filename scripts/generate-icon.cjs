const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;
const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '..', 'public', 'icon-256.png');
const icoPath = path.join(__dirname, '..', 'public', 'icon.ico');

pngToIco([pngPath])
  .then(buf => {
    fs.writeFileSync(icoPath, buf);
    console.log('✅ icon.ico generated from icon-256.png, size:', buf.length, 'bytes');
  })
  .catch(err => {
    console.error('❌ Failed:', err.message);
  });
