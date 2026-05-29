import { ILoginUser, ILoginUserServiceResponse, IRefreshTokenResponse, IRegisterUser } from './auth.interface';
export declare const AuthService: {
    registerUser: (payload: IRegisterUser) => Promise<ILoginUserServiceResponse>;
    loginUser: (payload: ILoginUser) => Promise<ILoginUserServiceResponse>;
    refreshToken: (token: string) => Promise<IRefreshTokenResponse>;
    logoutUser: (userId: string) => Promise<void>;
};
