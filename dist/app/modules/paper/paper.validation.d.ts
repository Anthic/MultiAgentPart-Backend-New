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
            slidesMarkdown: z.ZodOptional<z.ZodString>;
            slideCount: z.ZodOptional<z.ZodNumber>;
            peerReviewResults: z.ZodOptional<z.ZodObject<{
                overallScore: z.ZodOptional<z.ZodNumber>;
                methodologyFeedback: z.ZodOptional<z.ZodString>;
                domainFeedback: z.ZodOptional<z.ZodString>;
                clarityFeedback: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                overallScore?: number | undefined;
                methodologyFeedback?: string | undefined;
                domainFeedback?: string | undefined;
                clarityFeedback?: string | undefined;
            }, {
                overallScore?: number | undefined;
                methodologyFeedback?: string | undefined;
                domainFeedback?: string | undefined;
                clarityFeedback?: string | undefined;
            }>>;
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
            peerReviewResults?: {
                overallScore?: number | undefined;
                methodologyFeedback?: string | undefined;
                domainFeedback?: string | undefined;
                clarityFeedback?: string | undefined;
            } | undefined;
            attachedNotes?: string[] | undefined;
            slidesMarkdown?: string | undefined;
            slideCount?: number | undefined;
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
            peerReviewResults?: {
                overallScore?: number | undefined;
                methodologyFeedback?: string | undefined;
                domainFeedback?: string | undefined;
                clarityFeedback?: string | undefined;
            } | undefined;
            attachedNotes?: string[] | undefined;
            slidesMarkdown?: string | undefined;
            slideCount?: number | undefined;
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
            peerReviewResults?: {
                overallScore?: number | undefined;
                methodologyFeedback?: string | undefined;
                domainFeedback?: string | undefined;
                clarityFeedback?: string | undefined;
            } | undefined;
            attachedNotes?: string[] | undefined;
            slidesMarkdown?: string | undefined;
            slideCount?: number | undefined;
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
            peerReviewResults?: {
                overallScore?: number | undefined;
                methodologyFeedback?: string | undefined;
                domainFeedback?: string | undefined;
                clarityFeedback?: string | undefined;
            } | undefined;
            attachedNotes?: string[] | undefined;
            slidesMarkdown?: string | undefined;
            slideCount?: number | undefined;
        };
    }>;
};
