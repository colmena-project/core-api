const { randomBytes, createCipheriv, createDecipheriv } = require('crypto');

// const iv = Buffer.from(originalIv);
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

  const textParts = message.split(':');
  const iv = Buffer.from(textParts.shift() || '', 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

export { encrypt, decrypt };
