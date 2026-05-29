"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middlewares/auth");
const router = express_1.default.Router();
router.post('/register', auth_controller_1.AuthController.registerUser);
router.post('/login', auth_controller_1.AuthController.loginUser);
router.post('/refresh-token', auth_controller_1.AuthController.refreshToken);
router.post('/logout', auth_1.auth.authenticate, auth_controller_1.AuthController.logoutUser);
router.get('/me', auth_1.auth.authenticate, auth_controller_1.AuthController.getMe);
exports.AuthRoutes = router;
//# sourceMappingURL=auth.route.js.map