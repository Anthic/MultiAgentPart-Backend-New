"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const note_controller_1 = require("./note.controller");
const note_validation_1 = require("./note.validation");
const router = express_1.default.Router();
router.post('/', auth_1.auth.authenticate, (0, validateRequest_1.default)(note_validation_1.NoteValidation.createNoteSchema), note_controller_1.NoteController.createNote);
router.get('/', auth_1.auth.authenticate, note_controller_1.NoteController.getAllNotes);
router.get('/tags', auth_1.auth.authenticate, note_controller_1.NoteController.getAllTags);
router.get('/:id', auth_1.auth.authenticate, note_controller_1.NoteController.getSingleNote);
router.patch('/:id', auth_1.auth.authenticate, (0, validateRequest_1.default)(note_validation_1.NoteValidation.updateNoteSchema), note_controller_1.NoteController.updateNote);
router.delete('/:id', auth_1.auth.authenticate, note_controller_1.NoteController.deleteNote);
exports.NoteRoutes = router;
//# sourceMappingURL=note.route.js.map