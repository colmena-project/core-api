const { randomBytes, createCipheriv, createDecipheriv, scryptSync } = require('crypto');

const bitcoin = require('bitcoinjs-lib');

const IV_LENGTH = 16;

const encrypt = (message: string) => {
  const ENCRYPTION_KEY = process.env.SECRET_KEY_TOKEN || 'not found';

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(message);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (message: string) => {
  const ENCRYPTION_KEY = process.env.SECRET_KEY_TOKEN || 'not found';
  const SECRET_KEY = process.env.SECRET_KEY || 'not found';
  const encryptionAlgorithm = 'aes-192-cbc';

  const key = scryptSync(ENCRYPTION_KEY, SECRET_KEY, 24);
  const iv = randomBytes(16);
  const cipher = createDecipheriv(encryptionAlgorithm, key, iv);

  let encrypted = cipher.update(message);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
};

const privateToPublic = (privateKey: string) => {
  // Convert the private key from hex string to a Buffer
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');
  // Create an ECPair object from the private key
  const keyPair = bitcoin.ECPair.fromPrivateKey(privateKeyBuffer);
  // Get the compressed public key
  const publicKeyBuffer = keyPair.publicKey;
  // Get the hex string representation of the public key
  const publicKey = publicKeyBuffer.toString('hex');
  return publicKey;
};
export { encrypt, decrypt, privateToPublic };
