import { IParaphraseHistory } from './paraphrase.interface';
export declare const ParaphraseHistory: import("mongoose").Model<IParaphraseHistory, {}, {}, {}, import("mongoose").Document<unknown, {}, IParaphraseHistory, {}, import("mongoose").DefaultSchemaOptions> & IParaphraseHistory & Required<{
    _id: string | import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IParaphraseHistory>;
