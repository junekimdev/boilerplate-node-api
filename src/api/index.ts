import router from 'express-promise-router';
import APIv1 from './v1';

const rootRouter = router();
rootRouter.use('/v1', APIv1);

export default rootRouter;
