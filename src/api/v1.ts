import router from 'express-promise-router';
import createUser from '../services/createUser';
import createToken from '../services/createToken';
import readVapidPubKey from '../services/readVapidPubKey';
import saveSubscription from '../services/saveSubscription';
import sendNoti from '../services/sendNoti';

import basicAuth from './basicAuth';
import bearerAuth from './bearerAuth';

const APIv1 = router();

APIv1.post('/auth/user', createUser);
APIv1.post('/auth/token', basicAuth, createToken);
APIv1.get('/push/key', bearerAuth, readVapidPubKey);
APIv1.post('/push/register', bearerAuth, saveSubscription);
APIv1.post('/push/send', bearerAuth, sendNoti);

export default APIv1;
