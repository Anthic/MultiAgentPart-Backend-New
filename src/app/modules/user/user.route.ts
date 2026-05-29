import express from 'express';
import { UserController } from './user.controller';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.get('/me', auth.authenticate, UserController.getMe);
router.patch('/me', auth.authenticate, UserController.updateMe);

router.post(
  '/',
  auth.authenticate,
  auth.authorize('admin'),
  UserController.createUserByAdmin,
);
router.get(
  '/',
  auth.authenticate,
  auth.authorize('admin'),
  UserController.getAllUsers,
);
router.get(
  '/:userId',
  auth.authenticate,
  auth.authorize('admin'),
  UserController.getUserById,
);
router.delete(
  '/:userId',
  auth.authenticate,
  auth.authorize('admin'),
  UserController.deleteUserById,
);

export const UserRoutes = router;
