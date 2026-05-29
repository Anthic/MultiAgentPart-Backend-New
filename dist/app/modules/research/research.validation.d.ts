import { z } from 'zod';
export declare const ResearchValidation: {
    startResearchSchema: z.ZodObject<{
        body: z.ZodObject<{
            topic: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            topic: string;
        }, {
            topic: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        body: {
            topic: string;
        };
    }, {
        body: {
            topic: string;
        };
    }>;
};
