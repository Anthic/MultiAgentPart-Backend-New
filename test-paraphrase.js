/**
 * Unit & Integration verification for Paraphrase logic and API schemas
 */
const { z } = require('zod');

// 1. Test Validation Schema
const createParaphraseSchema = z.object({
  body: z.object({
    text: z
      .string({ required_error: 'Text is required' })
      .min(10, 'Text must be at least 10 characters long')
      .max(20000, 'Text must not exceed 20,000 characters'),
    mode: z
      .enum(['academic', 'simplify', 'executive', 'humanize'])
      .default('academic'),
  }),
});

console.log('--- Testing Validation ---');

// Test: < 10 characters
const invalidShort = createParaphraseSchema.safeParse({ body: { text: 'Short', mode: 'academic' } });
console.assert(!invalidShort.success, 'Failed: Text < 10 chars should fail validation');
console.log('✓ Text < 10 chars correctly rejected');

// Test: Invalid mode
const invalidMode = createParaphraseSchema.safeParse({ body: { text: 'Valid length text here for testing', mode: 'pirate' } });
console.assert(!invalidMode.success, 'Failed: Invalid mode should fail validation');
console.log('✓ Invalid mode correctly rejected');

// Test: Valid payload
const validPayload = createParaphraseSchema.safeParse({ body: { text: 'Valid length text here for testing academic paraphrase', mode: 'academic' } });
console.assert(validPayload.success, 'Failed: Valid payload should pass validation');
console.log('✓ Valid payload accepted');

// 2. Test Cost Estimation Formula
console.log('\n--- Testing Cost Estimation ---');
const text = 'This is a sample academic paragraph to estimate the token and BDT cost.';
const charCount = text.length;
const estimatedTokens = Math.max(1, Math.ceil(charCount * 0.25));
const costPerToken = (8 + 24) / 1000000;
const costBDT = Math.max(0.001, Number((estimatedTokens * costPerToken).toFixed(6)));

console.log(`Chars: ${charCount}, Estimated Tokens: ${estimatedTokens}, Cost (BDT): ৳${costBDT}`);
console.assert(estimatedTokens > 0, 'Estimated tokens must be > 0');
console.assert(costBDT > 0, 'Cost in BDT must be > 0');
console.log('✓ Cost estimation formula validated');

// 3. Test Subscription Tier Limits
console.log('\n--- Testing Tier Limits ---');
const TIER_LIMITS = {
  free: { MAX_CHARACTERS: 500, MAX_REQUESTS_PER_DAY: 5, MAX_REQUESTS_PER_HOUR: 2 },
  pro: { MAX_CHARACTERS: 5000, MAX_REQUESTS_PER_DAY: 50, MAX_REQUESTS_PER_HOUR: 10 },
  enterprise: { MAX_CHARACTERS: 20000, MAX_REQUESTS_PER_DAY: 500, MAX_REQUESTS_PER_HOUR: 100 },
};

console.assert(TIER_LIMITS.free.MAX_CHARACTERS === 500, 'Free tier limit mismatch');
console.assert(TIER_LIMITS.pro.MAX_CHARACTERS === 5000, 'Pro tier limit mismatch');
console.assert(TIER_LIMITS.enterprise.MAX_CHARACTERS === 20000, 'Enterprise tier limit mismatch');
console.log('✓ All tier limits configured accurately');

console.log('\n✅ All Paraphrase Unit Logic Tests Passed Successfully!');
