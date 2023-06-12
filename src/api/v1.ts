import router from 'express-promise-router';

import createToken from '../services/createToken';
import createUser from '../services/createUser';
import deleteUser from '../services/deleteUser';
import readUser from '../services/readUser';
import readVapidPubKey from '../services/readVapidPubKey';
import saveSubscription from '../services/saveSubscription';
import sendNoti from '../services/sendNoti';
import updateUser from '../services/updateUser';

import basicAuth from '../auth/basicAuth';
import bearerAuth from '../auth/bearerAuth';
import paramRole from '../auth/paramRole';
import refreshToken from '../auth/refreshToken';

import resPushAdmin from '../auth/resPushAdmin';
import resPushUser from '../auth/resPushUser';
import resUserpoolUser from '../auth/resUserpoolUser';

const APIv1 = router();

APIv1.post('/auth/user/:role', paramRole, createUser);
APIv1.get('/auth/user', resUserpoolUser, bearerAuth, readUser);
APIv1.put('/auth/user', resUserpoolUser, bearerAuth, updateUser);
APIv1.delete('/auth/user', resUserpoolUser, bearerAuth, deleteUser);
APIv1.post('/auth/token', basicAuth, createToken);
APIv1.post('/auth/refresh', refreshToken, createToken);

APIv1.get('/push/key', resPushUser, bearerAuth, readVapidPubKey);
APIv1.post('/push/register', resPushUser, bearerAuth, saveSubscription);
APIv1.post('/push/send', resPushAdmin, bearerAuth, sendNoti);

export default APIv1;
