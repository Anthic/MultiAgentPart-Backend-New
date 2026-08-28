import { INote } from './note.interface';
export declare const Note: import("mongoose").Model<INote, {}, {}, {}, import("mongoose").Document<unknown, {}, INote, {}, import("mongoose").DefaultSchemaOptions> & INote & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, INote>;
