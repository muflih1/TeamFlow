import {Router} from 'express';
import {
  createAccountHandler,
  meHandler,
  signInHandler,
  signOutHandler,
} from '../controllers/auth.controller.js';

const router = Router();

router
  .post('/sign-up', createAccountHandler)
  .post('/sign-in', signInHandler)
  .get('/me', meHandler)
  .delete('/sign-out', signOutHandler);

export default router;
