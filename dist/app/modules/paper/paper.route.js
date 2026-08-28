"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const paper_controller_1 = require("./paper.controller");
const paper_validation_1 = require("./paper.validation");
const router = express_1.default.Router();
router.post('/', auth_1.auth.authenticate, (0, validateRequest_1.default)(paper_validation_1.PaperValidation.createPaperSchema), paper_controller_1.PaperController.createPaper);
router.get('/', auth_1.auth.authenticate, paper_controller_1.PaperController.getAllPapers);
router.get('/:id', auth_1.auth.authenticate, paper_controller_1.PaperController.getSinglePaper);
router.patch('/:id', auth_1.auth.authenticate, (0, validateRequest_1.default)(paper_validation_1.PaperValidation.updatePaperSchema), paper_controller_1.PaperController.updatePaper);
router.delete('/:id', auth_1.auth.authenticate, paper_controller_1.PaperController.deletePaper);
router.post('/:id/citations', auth_1.auth.authenticate, paper_controller_1.PaperController.addCitation);
exports.PaperRoutes = router;
//# sourceMappingURL=paper.route.js.map