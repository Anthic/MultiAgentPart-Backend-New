import { Document } from 'mongoose';
export type ILoginUser = {
    email: string;
    password: string;
};
export type ILoginUserResponse = {
    user: {
        userId: string;
        name: string;
        email: string;
        role: 'admin' | 'user';
    };
};
export type IAuthTokens = {
    accessToken: string;
    refreshToken: string;
};
export type ILoginUserServiceResponse = ILoginUserResponse & IAuthTokens;
export type IRegisterUser = {
    name: string;
    email: string;
    password: string;
};
export type IRefreshTokenResponse = {
    accessToken: string;
    refreshToken: string;
};
export interface IAuthUserDocument extends Document {
    userId: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    refreshToken: string | null;
    loginAttempts: number;
    lockUntil: Date | null;
    passwordHistory: string[];
    isLocked(): boolean;
    incrementLoginAttempts(): Promise<void>;
    resetLoginAttempts(): Promise<void>;
}
