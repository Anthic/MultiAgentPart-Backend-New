import express from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';

const router = express.Router();

router.post('/register', validateRequest(AuthValidation.registerSchema), AuthController.registerUser);
router.post('/login', validateRequest(AuthValidation.loginSchema), AuthController.loginUser);
router.post('/refresh-token', validateRequest(AuthValidation.refreshSchema), AuthController.refreshToken);
router.post('/logout', auth.authenticate, AuthController.logoutUser);

// Added getMe route
router.get('/me', auth.authenticate, AuthController.getMe);

export const AuthRoutes = router;
