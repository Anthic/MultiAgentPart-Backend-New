export declare const validatePasswordComplexity: (password: string) => {
    isValid: boolean;
    errors: string[];
};
export declare const isPasswordHistory: (newPassword: string, history: string[]) => Promise<boolean>;
export declare const trimPasswordHistory: (history: string[], max?: number) => string[];
