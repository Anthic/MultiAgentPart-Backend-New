import { ITokenAuditLog, IWallet } from './wallet.interface';
export declare const Wallet: import("mongoose").Model<IWallet, {}, {}, {}, import("mongoose").Document<unknown, {}, IWallet, {}, import("mongoose").DefaultSchemaOptions> & IWallet & Required<{
    _id: string | import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IWallet>;
export declare const TokenAuditLog: import("mongoose").Model<ITokenAuditLog, {}, {}, {}, import("mongoose").Document<unknown, {}, ITokenAuditLog, {}, import("mongoose").DefaultSchemaOptions> & ITokenAuditLog & Required<{
    _id: string | import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITokenAuditLog>;
