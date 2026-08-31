import { IParaphraseRequest, IParaphraseResult, ICostEstimate, IParaphraseHistory } from './paraphrase.interface';
export declare const ParaphraseService: {
    paraphraseText: (userId: string, payload: IParaphraseRequest) => Promise<IParaphraseResult>;
    estimateCost: (text: string, model?: string) => ICostEstimate;
    getParaphraseHistory: (userId: string, limit?: number) => Promise<IParaphraseHistory[]>;
};
