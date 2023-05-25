export interface ISubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
export interface IReqBody {
  topic: string;
  subscription: ISubscription;
}
