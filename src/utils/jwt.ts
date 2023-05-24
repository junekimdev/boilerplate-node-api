import fs from 'fs';
import jsonwebtoken, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import path from 'path';

const { JWT_PRI_FILENAME = '', JWT_PUB_FILENAME = '', JWT_ISS = '' } = process.env;
const prv_path = path.join(__dirname, '..', '..', JWT_PRI_FILENAME);
const pub_path = path.join(__dirname, '..', '..', JWT_PUB_FILENAME);
const priFile = fs.readFileSync(prv_path);
const pubFile = fs.readFileSync(pub_path);
const alg = 'ES256';
const exp = '1d';
const tolerance = 10; // 10s tolerance for difference between servers

export type JwtPayload = jsonwebtoken.JwtPayload;
export type VerifyErrors = jsonwebtoken.VerifyErrors;

export const createSignOpt: (sub: string, aud: string) => SignOptions = (
  sub: string,
  aud: string,
) => {
  return {
    algorithm: alg,
    expiresIn: exp,
    audience: aud,
    subject: sub,
    issuer: JWT_ISS,
  };
};

export const createVerifyOpt: (aud: string) => VerifyOptions = (aud) => {
  return {
    algorithms: [alg],
    audience: aud,
    issuer: JWT_ISS,
    clockTolerance: tolerance,
    complete: false,
  };
};

export const sign = (
  payload: object,
  sub: string,
  aud: string,
  key: jsonwebtoken.Secret = priFile,
) => jsonwebtoken.sign(payload, key, createSignOpt(sub, sub));

export const verify = (token: string, aud: string, key: jsonwebtoken.Secret = pubFile) =>
  jsonwebtoken.verify(token, key, createVerifyOpt(aud)) as jsonwebtoken.JwtPayload;

export default { sign, verify };
