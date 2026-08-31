"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParaphraseValidation = void 0;
const zod_1 = require("zod");
const createParaphraseSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z
            .string({ required_error: 'Text is required' })
            .min(10, 'Text must be at least 10 characters long')
            .max(20000, 'Text must not exceed 20,000 characters'),
        mode: zod_1.z
            .enum(['academic', 'simplify', 'executive', 'humanize'], {
            errorMap: () => ({
                message: 'Mode must be one of: academic, simplify, executive, humanize',
            }),
        })
            .default('academic'),
    }),
});
exports.ParaphraseValidation = {
    createParaphraseSchema,
};
//# sourceMappingURL=paraphrase.validation.js.map