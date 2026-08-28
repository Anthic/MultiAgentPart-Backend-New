import express from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { NoteController } from './note.controller';
import { NoteValidation } from './note.validation';

const router = express.Router();

router.post(
  '/',
  auth.authenticate,
  validateRequest(NoteValidation.createNoteSchema),
  NoteController.createNote,
);

router.get('/', auth.authenticate, NoteController.getAllNotes);
router.get('/tags', auth.authenticate, NoteController.getAllTags);
router.get('/:id', auth.authenticate, NoteController.getSingleNote);

router.patch(
  '/:id',
  auth.authenticate,
  validateRequest(NoteValidation.updateNoteSchema),
  NoteController.updateNote,
);

router.delete('/:id', auth.authenticate, NoteController.deleteNote);

export const NoteRoutes = router;
