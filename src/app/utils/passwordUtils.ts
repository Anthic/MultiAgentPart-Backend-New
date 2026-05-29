import bcrypt from 'bcryptjs';

export const validatePasswordComplexity = (
  password: string,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Minimum 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push('One special character');
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const isPasswordHistory = async (
  newPassword: string,
  history: string[],
): Promise<boolean> => {
  for (const oldHashedPassword of history) {
    const isMatch = await bcrypt.compare(newPassword, oldHashedPassword);
    if (isMatch) {
      return true;
    }
  }
  return false;
};
export const trimPasswordHistory = (history: string[], max = 5): string[] => {
  return history.slice(-max);
};
