export interface IReqBody {
  email: string;
  password: string;
  surname?: string;
  given_name?: string;
}
export interface IResLocals {
  userId: number;
  roleName: string;
}
