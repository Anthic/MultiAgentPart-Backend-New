import { IAuthUserDocument } from './auth.interface';
export declare const AuthUser: import("mongoose").Model<IAuthUserDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IAuthUserDocument, {}, import("mongoose").DefaultSchemaOptions> & IAuthUserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAuthUserDocument>;
