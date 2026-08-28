import { z } from 'zod';
export declare const NoteValidation: {
    createNoteSchema: z.ZodObject<{
        body: z.ZodObject<{
            title: z.ZodString;
            content: z.ZodString;
            sourceUrl: z.ZodOptional<z.ZodString>;
            tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
            audioUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            content: string;
            tags: string[];
            sourceUrl?: string | undefined;
            audioUrl?: string | undefined;
        }, {
            title: string;
            content: string;
            sourceUrl?: string | undefined;
            tags?: string[] | undefined;
            audioUrl?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        body: {
            title: string;
            content: string;
            tags: string[];
            sourceUrl?: string | undefined;
            audioUrl?: string | undefined;
        };
    }, {
        body: {
            title: string;
            content: string;
            sourceUrl?: string | undefined;
            tags?: string[] | undefined;
            audioUrl?: string | undefined;
        };
    }>;
    updateNoteSchema: z.ZodObject<{
        body: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            content: z.ZodOptional<z.ZodString>;
            sourceUrl: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            audioUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title?: string | undefined;
            content?: string | undefined;
            sourceUrl?: string | undefined;
            tags?: string[] | undefined;
            audioUrl?: string | undefined;
        }, {
            title?: string | undefined;
            content?: string | undefined;
            sourceUrl?: string | undefined;
            tags?: string[] | undefined;
            audioUrl?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        body: {
            title?: string | undefined;
            content?: string | undefined;
            sourceUrl?: string | undefined;
            tags?: string[] | undefined;
            audioUrl?: string | undefined;
        };
    }, {
        body: {
            title?: string | undefined;
            content?: string | undefined;
            sourceUrl?: string | undefined;
            tags?: string[] | undefined;
            audioUrl?: string | undefined;
        };
    }>;
};
