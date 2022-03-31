//import {} from './types';
import { webpush } from '../../utils';

const provider = async (payload: any) => {
  const payloadStr = JSON.stringify(payload);
  await webpush.sendNotification(payloadStr, { contentEncoding: 'aes128gcm' }); // With Encryption
};

export default provider;
