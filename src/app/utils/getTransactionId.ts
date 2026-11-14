import { randomBytes } from 'crypto';

// Unguessable (80 bits of CSPRNG entropy) and <= 30 chars, the SSLCommerz
// tran_id limit. Date.now()+4 digits was enumerable, which let anyone fire
// fail/cancel callbacks at other users' pending payments.
export const getTransactionId = (): string => {
  return `ATLaSH_${randomBytes(10).toString('hex')}`;
};
