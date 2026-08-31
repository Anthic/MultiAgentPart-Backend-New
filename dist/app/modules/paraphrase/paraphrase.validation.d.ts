import { z } from 'zod';
export declare const ParaphraseValidation: {
    createParaphraseSchema: z.ZodObject<{
        body: z.ZodObject<{
            text: z.ZodString;
            mode: z.ZodDefault<z.ZodEnum<["academic", "simplify", "executive", "humanize"]>>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            mode: "academic" | "simplify" | "executive" | "humanize";
        }, {
            text: string;
            mode?: "academic" | "simplify" | "executive" | "humanize" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        body: {
            text: string;
            mode: "academic" | "simplify" | "executive" | "humanize";
        };
    }, {
        body: {
            text: string;
            mode?: "academic" | "simplify" | "executive" | "humanize" | undefined;
        };
    }>;
};
