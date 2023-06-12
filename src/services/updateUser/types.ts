import { JwtPayload } from 'jsonwebtoken';
export interface IResLocals {
  decodedToken: JwtPayload;
}
export interface IReqBody {
  surname?: string;
  given_name?: string;
}
export interface IUserInfo extends IReqBody {
  id: number;
}
