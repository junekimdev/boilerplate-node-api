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

import basicAuth from '../middleware/basicAuth';
import bearerAuth from '../middleware/bearerAuth';
import refreshToken from '../middleware/refreshToken';
import validRole from '../middleware/validateRole';
import validUserId from '../middleware/validateUserId';

import pushAdmin from '../middleware/allowPushAdmin';
import pushUser from '../middleware/allowPushUser';
import userAdmin from '../middleware/allowUserpoolAdmin';
import userUser from '../middleware/allowUserpoolUser';

const APIv1 = router();

APIv1.post('/auth/user', validRole, createUser);
APIv1.get('/auth/user', userUser, bearerAuth, validUserId, readUser);
APIv1.put('/auth/user', userUser, bearerAuth, validUserId, updateUser);
APIv1.delete('/auth/user', userUser, bearerAuth, validUserId, deleteUser);
APIv1.post('/auth/token', basicAuth, createToken);
APIv1.post('/auth/refresh', refreshToken, createToken);

APIv1.put('/admin/auth/user/role', userAdmin, bearerAuth, validUserId, validRole, updateUserRole);

APIv1.get('/push/key', pushUser, bearerAuth, readVapidPubKey);
APIv1.post('/push/register', pushUser, bearerAuth, saveSubscription);
APIv1.post('/push/send', pushAdmin, bearerAuth, sendNoti);

export default APIv1;
