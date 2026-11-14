// Regression tests for the backend audit fixes.
// Run: npm run test:unit   (no database / Redis needed; models are stubbed)
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

/* eslint-disable @typescript-eslint/no-var-requires */
const { PaymentService } = require('../src/app/modules/payment/payment.service');
const { Payment } = require('../src/app/modules/payment/payment.model');
const { SSLService } = require('../src/app/modules/sslCommerz/sslCommerz.service');
const { WalletService } = require('../src/app/modules/wallet/wallet.service');
const { sanitizeMiddleware } = require('../src/app/middlewares/sanitize.middleware');
const { sha256, safeEqualHex, accessBlacklistKey } = require('../src/app/utils/tokenSecurity');
const { jwtHelpers } = require('../src/app/helpers/jwtHelpers');
const { getTransactionId } = require('../src/app/utils/getTransactionId');
const { clampInt } = require('../src/app/utils/pagination');

// ---------------------------------------------------------------- payments
type Rec = { transactionId: string; userId: string; amountBDT: number; status: string; creditedAt: Date | null };

function installPaymentStubs(rec: Rec, gateway: any) {
  const credits: Array<[string, number]> = [];
  // Faithful enough to Mongo: the claim only succeeds while creditedAt is null.
  Payment.findOne = async (q: any) => (q.transactionId === rec.transactionId ? { ...rec } : null);
  Payment.findOneAndUpdate = async (q: any, u: any) => {
    if (q.transactionId !== rec.transactionId || rec.creditedAt !== null) return null;
    Object.assign(rec, u.$set);
    return { ...rec };
  };
  Payment.updateOne = async (q: any, u: any) => {
    if (q.transactionId !== rec.transactionId) return;
    if ('creditedAt' in q && rec.creditedAt !== null) return;
    if (q.status && rec.status !== q.status) return;
    Object.assign(rec, u.$set);
  };
  SSLService.validatePayment = async () => gateway;
  WalletService.addFundsToWallet = async (uid: string, amt: number) => {
    credits.push([uid, amt]);
  };
  return credits;
}

const fresh = (): Rec => ({ transactionId: 'T1', userId: 'u1', amountBDT: 100, status: 'UNPAID', creditedAt: null });
const goodGateway = { status: 'VALID', tran_id: 'T1', currency_type: 'BDT', currency_amount: '100.00' };

test('success callback without val_id never credits the wallet (was the free-money hole)', async () => {
  const rec = fresh();
  const credits = installPaymentStubs(rec, goodGateway);
  await assert.rejects(PaymentService.handlePaymentSuccess({ tran_id: 'T1' }));
  assert.equal(credits.length, 0);
  assert.equal(rec.creditedAt, null);
});

test('valid payment credits exactly once across success redirect + IPN + replay', async () => {
  const rec = fresh();
  const credits = installPaymentStubs(rec, goodGateway);
  const r1 = await PaymentService.handlePaymentSuccess({ tran_id: 'T1', val_id: 'V1' });
  const r2 = await PaymentService.handleIPNValidation({ tran_id: 'T1', val_id: 'V1' });
  const r3 = await PaymentService.handlePaymentSuccess({ tran_id: 'T1', val_id: 'V1' });
  assert.deepEqual(credits, [['u1', 100]]);
  assert.match(r1.message, /Successfully recharged/);
  assert.equal(r2.credited, false);
  assert.match(r3.message, /already processed/);
});

test('concurrent success + IPN credit once (atomic claim)', async () => {
  const rec = fresh();
  const credits = installPaymentStubs(rec, goodGateway);
  await Promise.all([
    PaymentService.handlePaymentSuccess({ tran_id: 'T1', val_id: 'V1' }),
    PaymentService.handleIPNValidation({ tran_id: 'T1', val_id: 'V1' }),
  ]);
  assert.equal(credits.length, 1);
});

test('gateway amount lower than the recorded amount is rejected', async () => {
  const rec = fresh();
  const credits = installPaymentStubs(rec, { ...goodGateway, currency_amount: '10.00' });
  await assert.rejects(PaymentService.handlePaymentSuccess({ tran_id: 'T1', val_id: 'V1' }));
  assert.equal(credits.length, 0);
  assert.equal(rec.status, 'FAILED');
});

test('val_id that belongs to a different transaction is rejected', async () => {
  const rec = fresh();
  const credits = installPaymentStubs(rec, { ...goodGateway, tran_id: 'SOMEONE_ELSE' });
  await assert.rejects(PaymentService.handlePaymentSuccess({ tran_id: 'T1', val_id: 'V1' }));
  assert.equal(credits.length, 0);
});

test('non-BDT currency is rejected', async () => {
  const rec = fresh();
  const credits = installPaymentStubs(rec, { ...goodGateway, currency_type: 'USD' });
  await assert.rejects(PaymentService.handlePaymentSuccess({ tran_id: 'T1', val_id: 'V1' }));
  assert.equal(credits.length, 0);
});

test('gateway status other than VALID/VALIDATED is rejected', async () => {
  const rec = fresh();
  const credits = installPaymentStubs(rec, { ...goodGateway, status: 'FAILED' });
  await assert.rejects(PaymentService.handleIPNValidation({ tran_id: 'T1', val_id: 'V1' }));
  assert.equal(credits.length, 0);
});

test('fail/cancel callbacks cannot overwrite a PAID payment', async () => {
  const rec = fresh();
  installPaymentStubs(rec, goodGateway);
  await PaymentService.handlePaymentSuccess({ tran_id: 'T1', val_id: 'V1' });
  await PaymentService.handlePaymentFail({ tran_id: 'T1' });
  await PaymentService.handlePaymentCancel({ transactionId: 'T1' });
  assert.equal(rec.status, 'PAID');
});

test('a failed wallet credit releases the claim so the IPN retry can finish', async () => {
  const rec = fresh();
  installPaymentStubs(rec, goodGateway);
  let calls = 0;
  const credits: number[] = [];
  WalletService.addFundsToWallet = async (_u: string, amt: number) => {
    if (++calls === 1) throw new Error('db down');
    credits.push(amt);
  };
  await assert.rejects(PaymentService.handleIPNValidation({ tran_id: 'T1', val_id: 'V1' }));
  assert.equal(rec.creditedAt, null);
  await PaymentService.handleIPNValidation({ tran_id: 'T1', val_id: 'V1' });
  assert.deepEqual(credits, [100]);
});

test('init-recharge rejects bad amounts and unsupported payment types', async () => {
  await assert.rejects(PaymentService.initRechargePayment('u1', NaN));
  await assert.rejects(PaymentService.initRechargePayment('u1', 5));
  await assert.rejects(PaymentService.initRechargePayment('u1', 10_000_000));
  await assert.rejects(PaymentService.initRechargePayment('u1', 100, 'subscription_pro'));
});

test('transaction ids are unguessable, unique and within the 30-char gateway limit', () => {
  const ids = new Set(Array.from({ length: 500 }, () => getTransactionId()));
  assert.equal(ids.size, 500);
  for (const id of ids) assert.ok(id.length <= 30, id);
});

// ---------------------------------------------------------- refresh tokens
test('refresh tokens: sha256 distinguishes tokens that bcrypt (72-byte limit) could not', () => {
  const payload = { userId: 'u1', role: 'user', email: 'a@b.c' };
  const a = jwtHelpers.createToken({ ...payload, jti: '1' }, process.env.JWT_REFRESH_SECRET as string, '7d');
  const b = jwtHelpers.createToken({ ...payload, jti: '2' }, process.env.JWT_REFRESH_SECRET as string, '7d');
  assert.equal(a.slice(0, 72), b.slice(0, 72), 'precondition: the first 72 bytes collide');
  assert.notEqual(sha256(a), sha256(b));
  assert.equal(safeEqualHex(sha256(a), sha256(a)), true);
  assert.equal(safeEqualHex(sha256(a), sha256(b)), false);
  assert.equal(safeEqualHex('abc', 'abcd'), false);
});

test('access-token blacklist key never contains the raw token', () => {
  const key = accessBlacklistKey('secret.jwt.value');
  assert.ok(!key.includes('secret.jwt.value'));
  assert.ok(key.startsWith('token_blacklist:'));
});

// --------------------------------------------------------------- sanitizer
function runSanitize(body: any) {
  const req: any = { body, query: {}, params: {} };
  sanitizeMiddleware(req, {} as any, () => undefined);
  return req.body;
}

test('sanitizer leaves passwords and tokens untouched', () => {
  const out = runSanitize({ email: 'a@b.c', password: 'Pa<b>ss!<1>word', refreshToken: 'x<y>z' });
  assert.equal(out.password, 'Pa<b>ss!<1>word');
  assert.equal(out.refreshToken, 'x<y>z');
});

test('sanitizer strips real tags from ordinary fields but keeps comparisons', () => {
  const out = runSanitize({ title: 'Hi <script>alert(1)</script> there', topic: 'is 3 < 5 and 7 > 2' });
  assert.equal(out.title, 'Hi alert(1) there');
  assert.equal(out.topic, 'is 3 < 5 and 7 > 2');
});

test('sanitizer does not mangle document text fields', () => {
  const out = runSanitize({ content: 'use <div> and a < b > c' });
  assert.equal(out.content, 'use <div> and a < b > c');
});

// -------------------------------------------------------------- pagination
test('clampInt bounds user-supplied limits', () => {
  assert.equal(clampInt('1000000', 20, 1, 100), 100);
  assert.equal(clampInt('-5', 20, 1, 100), 1);
  assert.equal(clampInt('abc', 20, 1, 100), 20);
  assert.equal(clampInt(undefined, 20, 1, 100), 20);
  assert.equal(clampInt('7', 20, 1, 100), 7);
});
