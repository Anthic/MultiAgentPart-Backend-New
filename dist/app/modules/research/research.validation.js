"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchValidation = void 0;
const zod_1 = require("zod");
const startResearchSchema = zod_1.z.object({
    body: zod_1.z.object({
        topic: zod_1.z
            .string({ required_error: 'Topic is required' })
            .min(3, 'Topic must be at least 3 characters long')
            .max(500, 'Topic must not exceed 500 characters'),
    }),
});
exports.ResearchValidation = {
    startResearchSchema,
};
//# sourceMappingURL=research.validation.js.map