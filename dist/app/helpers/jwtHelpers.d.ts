import { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
export declare const jwtHelpers: {
    createToken: (payload: Record<string, unknown>, secret: Secret, expiresIn: SignOptions["expiresIn"]) => string;
    verifyToken: (token: string, secret: Secret) => JwtPayload;
};
