"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParaphraseRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const paraphrase_controller_1 = require("./paraphrase.controller");
const paraphrase_validation_1 = require("./paraphrase.validation");
const router = express_1.default.Router();
router.post('/', auth_1.auth.authenticate, (0, validateRequest_1.default)(paraphrase_validation_1.ParaphraseValidation.createParaphraseSchema), paraphrase_controller_1.ParaphraseController.paraphraseText);
router.post('/estimate', auth_1.auth.authenticate, paraphrase_controller_1.ParaphraseController.estimateCost);
router.get('/history', auth_1.auth.authenticate, paraphrase_controller_1.ParaphraseController.getParaphraseHistory);
exports.ParaphraseRoutes = router;
//# sourceMappingURL=paraphrase.route.js.map