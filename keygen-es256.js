const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getArgs, askQuestion } = require('./codegen-util');

const write = (str, filePath, flags) => {
  const writer = fs.createWriteStream(filePath, { flags });
  writer.write(str);
  writer.end();
};

const main = async () => {
  console.log('Key generation started...');
  try {
    let { name } = getArgs();

    // Check that the required flags are in
    if (!name) {
      console.log('File name is NOT found!');
      name = await askQuestion('File name, plz? [es256] ');
      if (name === '') name = 'es256';
    }

    // ES256 Key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    const prvfile = `${name}_prv.pem`;
    const pubfile = `${name}_pub.pem`;
    const prvFilePath = path.join(__dirname, prvfile);
    const pubFilePath = path.join(__dirname, pubfile);

    try {
      fs.accessSync(prvFilePath);
      fs.accessSync(pubFilePath);
      console.log('Key pair files with the given name already exists');
      const ans = await askQuestion('Do you want to overwrite it? [y/n] ');
      if (ans !== 'y' && ans !== 'Y') process.exit(1);
    } catch (error) {
      //Do nothing
    }

    write(privateKey.toString(), prvFilePath, 'w');
    write(publicKey.toString(), pubFilePath, 'w');

    console.log(`Keys(${prvfile}, ${pubfile}) have been successfully created`);
  } catch (error) {
    console.log(error);
  }
};

main();
