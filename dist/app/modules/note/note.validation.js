"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteValidation = void 0;
const zod_1 = require("zod");
const createNoteSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: 'Title is required' }).min(2),
        content: zod_1.z.string({ required_error: 'Content is required' }).min(1),
        sourceUrl: zod_1.z.string().url().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
        audioUrl: zod_1.z.string().url().optional(),
    }),
});
const updateNoteSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        content: zod_1.z.string().min(1).optional(),
        sourceUrl: zod_1.z.string().url().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        audioUrl: zod_1.z.string().url().optional(),
    }),
});
exports.NoteValidation = {
    createNoteSchema,
    updateNoteSchema,
};
//# sourceMappingURL=note.validation.js.map