"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchRoutes = void 0;
const express_1 = __importDefault(require("express"));
const research_controller_1 = require("./research.controller");
const auth_1 = require("../../middlewares/auth");
const research_validation_1 = require("./research.validation");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const router = express_1.default.Router();
router.get('/health', research_controller_1.ResearchController.getAgentHealth);
router.get('/cache-stats', auth_1.auth.authenticate, research_controller_1.ResearchController.getCacheStats);
router.post('/', auth_1.auth.authenticate, (0, validateRequest_1.default)(research_validation_1.ResearchValidation.startResearchSchema), rateLimiter_1.aiRequestLimiter, research_controller_1.ResearchController.startResearch);
router.get('/quota', auth_1.auth.authenticate, research_controller_1.ResearchController.getResearchQuota);
router.get('/job/:jobId', auth_1.auth.authenticate, research_controller_1.ResearchController.getJobStatus);
router.get('/history', auth_1.auth.authenticate, research_controller_1.ResearchController.getResearchHistory);
router.get('/history/:id', auth_1.auth.authenticate, research_controller_1.ResearchController.getHistoryById);
exports.ResearchRoutes = router;
//# sourceMappingURL=research.route.js.map