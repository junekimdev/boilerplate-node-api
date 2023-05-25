//import {} from './types';
import { webpush } from '../../utils';

const provider = async (topic: string, payload: any) => {
  const payloadStr = JSON.stringify(payload);
  await webpush.sendNotiByTopic(topic, payloadStr, { contentEncoding: 'aes128gcm' }); // With Encryption
};

export default provider;
