const fs = require('fs');
const os = require('os');
const path = require('path');
const webpush = require('web-push');

const write = (str, filename, flags) => {
  const filePath = path.join(__dirname, `${filename}`);
  const writer = fs.createWriteStream(filePath, { flags });
  writer.write(str);
  writer.end();
};

(() => {
  const vapidKeys = webpush.generateVAPIDKeys();

  // console.log('Public key:', vapidKeys.publicKey); // Base64 encoded
  // console.log('Private key:', vapidKeys.privateKey); // Base64 encoded

  const pubKeyStr = `VAPID_PUB_KEY=${vapidKeys.publicKey}`;
  const prvKeyStr = `VAPID_PRI_KEY=${vapidKeys.privateKey}`;

  const keys = [pubKeyStr, prvKeyStr].join(os.EOL);
  write(keys, '.env', 'a');
})();
