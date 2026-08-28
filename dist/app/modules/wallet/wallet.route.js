"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const wallet_controller_1 = require("./wallet.controller");
const router = express_1.default.Router();
router.get('/balance', auth_1.auth.authenticate, wallet_controller_1.WalletController.getMyWallet);
router.get('/logs', auth_1.auth.authenticate, wallet_controller_1.WalletController.getAuditLogs);
router.post('/add-funds', auth_1.auth.authenticate, wallet_controller_1.WalletController.addFunds);
exports.WalletRoutes = router;
//# sourceMappingURL=wallet.route.js.map