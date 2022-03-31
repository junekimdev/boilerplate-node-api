import crypto from 'crypto';

const sha256 = async (payload: string) => {
  return crypto.createHash('sha256').update(payload).digest('base64');
};

/**
 * @returns salt's length is 16 character
 */
const createSalt = () => crypto.randomBytes(12).toString('base64');

const createUUID = () => crypto.randomUUID();

export default { sha256, createSalt, createUUID };
