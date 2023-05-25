import { PushSubscription } from 'web-push';

export interface IReqBody {
  topic: string;
  subscription: PushSubscription;
}
