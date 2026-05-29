export type IUser = {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
};
export type IUserUpdatePayload = {
    name?: string;
    email?: string;
};
export type IAdminCreateUser = {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
};
