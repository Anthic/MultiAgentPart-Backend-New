import { IPaper } from './paper.interface';
export declare const Paper: import("mongoose").Model<IPaper, {}, {}, {}, import("mongoose").Document<unknown, {}, IPaper, {}, import("mongoose").DefaultSchemaOptions> & IPaper & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IPaper>;
