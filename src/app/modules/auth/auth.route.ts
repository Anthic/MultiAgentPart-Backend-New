import express from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.post('/register', AuthController.registerUser);
router.post('/login', AuthController.loginUser);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', auth.authenticate, AuthController.logoutUser);

// Added getMe route
router.get('/me', auth.authenticate, AuthController.getMe);

export const AuthRoutes = router;
