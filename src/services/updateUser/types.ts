export interface IReqBody {
  update_data: any;
}
export interface IResLocals {
  userId: number;
}
export interface IUserInfo extends IResLocals {
  surname?: string;
  given_name?: string;
}
