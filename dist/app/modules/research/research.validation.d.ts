import { z } from 'zod';
export declare const ResearchValidation: {
    startResearchSchema: z.ZodObject<{
        body: z.ZodObject<{
            topic: z.ZodString;
            mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["fast", "deep"]>>>;
        }, "strip", z.ZodTypeAny, {
            topic: string;
            mode: "fast" | "deep";
        }, {
            topic: string;
            mode?: "fast" | "deep" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        body: {
            topic: string;
            mode: "fast" | "deep";
        };
    }, {
        body: {
            topic: string;
            mode?: "fast" | "deep" | undefined;
        };
    }>;
};
