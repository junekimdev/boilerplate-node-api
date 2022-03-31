const fs = require('fs');
const os = require('os');
const webpush = require('web-push');

const write = (str, filename, flags) => {
  const filePath = path.join(__dirname, `${filename}.ts`);
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

  const str = [pubKeyStr, prvKeyStr].join(os.EOL);

  write(str, '.env', 'a');
})();
