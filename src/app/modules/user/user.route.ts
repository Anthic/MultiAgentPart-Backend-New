import express from 'express';
import { UserController } from './user.controller';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';

const router = express.Router();

router.get('/me', auth.authenticate, UserController.getMe);
router.patch(
  '/me',
  auth.authenticate,
  validateRequest(UserValidation.updateMeSchema),
  UserController.updateMe,
);

router.post(
  '/',
  auth.authenticate,
  auth.authorize('admin'),
  validateRequest(UserValidation.createUserSchema),
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
