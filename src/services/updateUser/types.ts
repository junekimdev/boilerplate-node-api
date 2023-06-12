export interface IReqBody {
  surname?: string;
  given_name?: string;
}
export interface IResLocals {
  userId: number;
}
export interface IUserInfo extends IReqBody {
  id: number;
}
