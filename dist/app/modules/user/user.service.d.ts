import { IAdminCreateUser, IUser, IUserUpdatePayload } from './user.interface';
export declare const UserService: {
    createUserByAdmin: (payload: IAdminCreateUser) => Promise<IUser>;
    getAllUsers: () => Promise<IUser[]>;
    getUserById: (userId: string) => Promise<IUser>;
    deleteUserById: (userId: string) => Promise<void>;
    getMe: (userId: string) => Promise<IUser>;
    updateMe: (userId: string, payload: IUserUpdatePayload) => Promise<IUser>;
};
