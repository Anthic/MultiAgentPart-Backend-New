import { IPaper } from "./paper.interface";
export declare const PaperService: {
    createPaper: (payload: IPaper, userId: string) => Promise<IPaper>;
    getAllPapers: (userId: string) => Promise<IPaper[]>;
    getSinglePaper: (id: string, userId: string) => Promise<IPaper>;
    updatePaper: (id: string, userId: string, payload: Partial<IPaper>) => Promise<IPaper | null>;
    deletePaper: (id: string, userId: string) => Promise<IPaper | null>;
    addCitation: (id: string, userId: string, citation: any) => Promise<import("mongoose").Document<unknown, {}, IPaper, {}, import("mongoose").DefaultSchemaOptions> & IPaper & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    generateDefenseQuestions: (id: string, userId: string) => Promise<any>;
    evaluateDefenseRebuttal: (id: string, userId: string, payload: {
        examiner_name: string;
        examiner_title: string;
        question: string;
        student_answer: string;
    }) => Promise<any>;
};
