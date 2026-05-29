"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_1 = require("../../middlewares/auth");
const router = express_1.default.Router();
router.get('/me', auth_1.auth.authenticate, user_controller_1.UserController.getMe);
router.patch('/me', auth_1.auth.authenticate, user_controller_1.UserController.updateMe);
router.post('/', auth_1.auth.authenticate, auth_1.auth.authorize('admin'), user_controller_1.UserController.createUserByAdmin);
router.get('/', auth_1.auth.authenticate, auth_1.auth.authorize('admin'), user_controller_1.UserController.getAllUsers);
router.get('/:userId', auth_1.auth.authenticate, auth_1.auth.authorize('admin'), user_controller_1.UserController.getUserById);
router.delete('/:userId', auth_1.auth.authenticate, auth_1.auth.authorize('admin'), user_controller_1.UserController.deleteUserById);
exports.UserRoutes = router;
//# sourceMappingURL=user.route.js.map