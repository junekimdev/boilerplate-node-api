import router from 'express-promise-router';

import createPushTopic from '../services/createPushTopic';
import createRole from '../services/createRole';
import createToken from '../services/createToken';
import createUser from '../services/createUser';
import deletePushTopic from '../services/deletePushTopic';
import deleteRole from '../services/deleteRole';
import deleteUser from '../services/deleteUser';
import deleteUserPic from '../services/deleteUserPic';
import readGroupRole from '../services/readGroupRole';
import readPushTopic from '../services/readPushTopic';
import readResource from '../services/readResource';
import readRole from '../services/readRole';
import readUser from '../services/readUser';
import readUserPic from '../services/readUserPic';
import readVapidPubKey from '../services/readVapidPubKey';
import saveSubscription from '../services/saveSubscription';
import sendNoti from '../services/sendNoti';
import updateGroupRole from '../services/updateGroupRole';
import updatePushTopic from '../services/updatePushTopic';
import updateRole from '../services/updateRole';
import updateUser from '../services/updateUser';
import updateUserPic from '../services/updateUserPic';
import updateUserPwd from '../services/updateUserPwd';
import updateUserRole from '../services/updateUserRole';

import basicAuth from '../middleware/basicAuth';
import bearerAuth from '../middleware/bearerAuth';
import refreshToken from '../middleware/refreshToken';
import uploadImageProfile from '../middleware/uploadImageProfile';
// import uploadImagesMax from '../middleware/uploadImagesMax';
import validRole from '../middleware/validateRole';
import validTopic from '../middleware/validateTopic';
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
APIv1.put('/auth/user/pic', userpoolUser, uploadImageProfile, updateUserPic);
APIv1.get('/auth/user/pic', userpoolUser, readUserPic);
APIv1.delete('/auth/user/pic', userpoolUser, deleteUserPic);

APIv1.post('/auth/token', basicAuth, createToken);
APIv1.post('/auth/refresh', refreshToken, createToken);

APIv1.post('/admin/auth/role', userpoolAdmin, validRole, createRole);
APIv1.get('/admin/auth/role', userpoolAdmin, validRole, readRole);
APIv1.put('/admin/auth/role', userpoolAdmin, validRole, updateRole);
APIv1.delete('/admin/auth/role', userpoolAdmin, validRole, deleteRole);
APIv1.get('/admin/auth/user', userpoolAdmin, readUser);
APIv1.put('/admin/auth/user', userpoolAdmin, updateUser);
APIv1.delete('/admin/auth/user', userpoolAdmin, deleteUser);
APIv1.put('/admin/auth/user/pass', userpoolAdmin, updateUserPwd);
APIv1.put('/admin/auth/user/role', userpoolAdmin, validRole, updateUserRole);
APIv1.get('/admin/auth/group/role', userpoolAdmin, validRole, readGroupRole);
APIv1.put('/admin/auth/group/role', userpoolAdmin, validRole, updateGroupRole);
APIv1.get('/admin/auth/resource', userpoolAdmin, readResource);

APIv1.get('/push/key', pushUser, readVapidPubKey);
APIv1.post('/push/register', pushUser, saveSubscription);
APIv1.post('/admin/push/send', pushAdmin, sendNoti);
APIv1.post('/admin/push/topic', pushAdmin, validTopic, createPushTopic);
APIv1.get('/admin/push/topic', pushAdmin, validTopic, readPushTopic);
APIv1.put('/admin/push/topic', pushAdmin, validTopic, updatePushTopic);
APIv1.delete('/admin/push/topic', pushAdmin, validTopic, deletePushTopic);

export default APIv1;
