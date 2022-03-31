import fs from 'fs';
import path from 'path';
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

const JWT_ALGORITHM = 'ES256';
const JWT_EXPIRE_IN = '1d';
const {
  JWT_PRI_FILENAME = '',
  JWT_PUB_FILENAME = '',
  JWT_AUD = '',
  JWT_ISS = '',
} = process.env;
const PRI_PATH = path.join(__dirname, '..', '..', JWT_PRI_FILENAME);
const PUB_PATH = path.join(__dirname, '..', '..', JWT_PUB_FILENAME);

const priFile = fs.readFileSync(PRI_PATH);
const pubFile = fs.readFileSync(PUB_PATH);

const createSignOpt = (sub: string) => {
  const opt: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRE_IN,
    audience: JWT_AUD,
    subject: sub,
    issuer: JWT_ISS,
  };
  return opt;
};

const createVerifyOpt = () => {
  const opt: VerifyOptions = {
    algorithms: [JWT_ALGORITHM],
    audience: JWT_AUD,
    issuer: JWT_ISS,
    clockTolerance: 10, // 10s tolerance for difference between servers
    complete: false,
  };
  return opt;
};

const sign = (payload: string | object | Buffer, sub: string) =>
  jwt.sign(payload, priFile, createSignOpt(sub));

const verify = (token: string) =>
  jwt.verify(token, pubFile, createVerifyOpt()) as jwt.JwtPayload;

export type JwtPayload = jwt.JwtPayload;
export type VerifyErrors = jwt.VerifyErrors;

export default { sign, verify };
