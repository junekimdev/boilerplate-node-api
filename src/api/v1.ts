import router from 'express-promise-router';

import createRole from '../services/createRole';
import createToken from '../services/createToken';
import createUser from '../services/createUser';
import deleteUser from '../services/deleteUser';
import readUser from '../services/readUser';
import readVapidPubKey from '../services/readVapidPubKey';
import saveSubscription from '../services/saveSubscription';
import sendNoti from '../services/sendNoti';
import updateUser from '../services/updateUser';
import updateUserPwd from '../services/updateUserPwd';
import updateUserRole from '../services/updateUserRole';

import basicAuth from '../middleware/basicAuth';
import bearerAuth from '../middleware/bearerAuth';
import refreshToken from '../middleware/refreshToken';
import validRole from '../middleware/validateRole';
import validateUserIdAdmin from '../middleware/validateUserIdAdmin';
import validateUserIdUser from '../middleware/validateUserIdUser';

import allowPushAdmin from '../middleware/allowPushAdmin';
import allowPushUser from '../middleware/allowPushUser';
import allowUserpoolAdmin from '../middleware/allowUserpoolAdmin';
import allowUserpoolUser from '../middleware/allowUserpoolUser';

const userpoolUser = [allowUserpoolUser, bearerAuth, validateUserIdUser];
const userpoolAdmin = [allowUserpoolAdmin, bearerAuth, validateUserIdAdmin];
const pushUser = [allowPushUser, bearerAuth];
const pushAdmin = [allowPushAdmin, bearerAuth];

const APIv1 = router();

APIv1.post('/auth/user', validRole, createUser);
APIv1.get('/auth/user', userpoolUser, readUser);
APIv1.put('/auth/user', userpoolUser, updateUser);
APIv1.delete('/auth/user', userpoolUser, deleteUser);
APIv1.put('/auth/user/pass', userpoolUser, updateUserPwd);

APIv1.post('/auth/token', basicAuth, createToken);
APIv1.post('/auth/refresh', refreshToken, createToken);

APIv1.post('/admin/auth/role', userpoolAdmin, createRole);
APIv1.put('/admin/auth/user/role', userpoolAdmin, validRole, updateUserRole);

APIv1.get('/push/key', pushUser, readVapidPubKey);
APIv1.post('/push/register', pushUser, saveSubscription);
APIv1.post('/push/send', pushAdmin, sendNoti);

export default APIv1;
