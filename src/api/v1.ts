import router from 'express-promise-router';

import createToken from '../services/createToken';
import createUser from '../services/createUser';
import deleteUser from '../services/deleteUser';
import readUser from '../services/readUser';
import readVapidPubKey from '../services/readVapidPubKey';
import saveSubscription from '../services/saveSubscription';
import sendNoti from '../services/sendNoti';
import updateUser from '../services/updateUser';
import updateUserRole from '../services/updateUserRole';

import basicAuth from '../auth/basicAuth';
import bearerAuth from '../auth/bearerAuth';
import role from '../auth/paramRole';
import userId from '../auth/paramUserId';
import refreshToken from '../auth/refreshToken';

import pushAdmin from '../auth/resPushAdmin';
import pushUser from '../auth/resPushUser';
import userAdmin from '../auth/resUserpoolAdmin';
import userUser from '../auth/resUserpoolUser';

const APIv1 = router();

APIv1.post('/auth/user', role, createUser);
APIv1.get('/auth/user', userUser, bearerAuth, userId, readUser);
APIv1.put('/auth/user', userUser, bearerAuth, userId, updateUser);
APIv1.delete('/auth/user', userUser, bearerAuth, userId, deleteUser);
APIv1.post('/auth/token', basicAuth, createToken);
APIv1.post('/auth/refresh', refreshToken, createToken);

APIv1.put('/admin/auth/user/role', userAdmin, bearerAuth, userId, role, updateUserRole);

APIv1.get('/push/key', pushUser, bearerAuth, readVapidPubKey);
APIv1.post('/push/register', pushUser, bearerAuth, saveSubscription);
APIv1.post('/push/send', pushAdmin, bearerAuth, sendNoti);

export default APIv1;
