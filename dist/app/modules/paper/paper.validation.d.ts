import { z } from 'zod';
export declare const PaperValidation: {
    createPaperSchema: z.ZodObject<{
        body: z.ZodObject<{
            title: z.ZodString;
            contentMarkdown: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            abstract: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            citations: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
                citationKey: z.ZodString;
                title: z.ZodString;
                url: z.ZodString;
                doi: z.ZodOptional<z.ZodString>;
                authors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                year: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }, {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }>, "many">>>;
            attachedNotes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
            status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["draft", "in_review", "published", "archived"]>>>;
        }, "strip", z.ZodTypeAny, {
            status: "draft" | "in_review" | "published" | "archived";
            title: string;
            contentMarkdown: string;
            abstract: string;
            citations: {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }[];
            attachedNotes: string[];
        }, {
            title: string;
            status?: "draft" | "in_review" | "published" | "archived" | undefined;
            contentMarkdown?: string | undefined;
            abstract?: string | undefined;
            citations?: {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }[] | undefined;
            attachedNotes?: string[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        body: {
            status: "draft" | "in_review" | "published" | "archived";
            title: string;
            contentMarkdown: string;
            abstract: string;
            citations: {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }[];
            attachedNotes: string[];
        };
    }, {
        body: {
            title: string;
            status?: "draft" | "in_review" | "published" | "archived" | undefined;
            contentMarkdown?: string | undefined;
            abstract?: string | undefined;
            citations?: {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }[] | undefined;
            attachedNotes?: string[] | undefined;
        };
    }>;
    updatePaperSchema: z.ZodObject<{
        body: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            contentMarkdown: z.ZodOptional<z.ZodString>;
            abstract: z.ZodOptional<z.ZodString>;
            citations: z.ZodOptional<z.ZodArray<z.ZodObject<{
                citationKey: z.ZodString;
                title: z.ZodString;
                url: z.ZodString;
                doi: z.ZodOptional<z.ZodString>;
                authors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                year: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }, {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }>, "many">>;
            attachedNotes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            status: z.ZodOptional<z.ZodEnum<["draft", "in_review", "published", "archived"]>>;
        }, "strip", z.ZodTypeAny, {
            status?: "draft" | "in_review" | "published" | "archived" | undefined;
            title?: string | undefined;
            contentMarkdown?: string | undefined;
            abstract?: string | undefined;
            citations?: {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }[] | undefined;
            attachedNotes?: string[] | undefined;
        }, {
            status?: "draft" | "in_review" | "published" | "archived" | undefined;
            title?: string | undefined;
            contentMarkdown?: string | undefined;
            abstract?: string | undefined;
            citations?: {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }[] | undefined;
            attachedNotes?: string[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        body: {
            status?: "draft" | "in_review" | "published" | "archived" | undefined;
            title?: string | undefined;
            contentMarkdown?: string | undefined;
            abstract?: string | undefined;
            citations?: {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }[] | undefined;
            attachedNotes?: string[] | undefined;
        };
    }, {
        body: {
            status?: "draft" | "in_review" | "published" | "archived" | undefined;
            title?: string | undefined;
            contentMarkdown?: string | undefined;
            abstract?: string | undefined;
            citations?: {
                url: string;
                citationKey: string;
                title: string;
                year?: string | undefined;
                doi?: string | undefined;
                authors?: string[] | undefined;
            }[] | undefined;
            attachedNotes?: string[] | undefined;
        };
    }>;
};
