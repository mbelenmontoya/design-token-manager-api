const stripeEnv = process.env.STRIPE_SECRET_KEY;
const describeIf = stripeEnv ? describe : describe.skip;

describeIf('Billing', () => {
  it('placeholder - billing tests run only when Stripe env vars are present', () => {
    expect(true).toBe(true);
  });
});
