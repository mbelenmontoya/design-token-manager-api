import crypto from 'crypto';

/**
 * Validates Mercado Pago webhook signature using HMAC-SHA256
 *
 * Mercado Pago sends webhooks with an X-Signature header containing:
 * - ts (timestamp)
 * - v1 (HMAC signature)
 *
 * Format: "ts=<timestamp>,v1=<signature>"
 *
 * @param {Object} params - Validation parameters
 * @param {string} params.signature - X-Signature header value
 * @param {string} params.body - Raw request body (JSON string)
 * @param {string} params.secret - Webhook secret from Mercado Pago
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateMercadoPagoSignature({ signature, body, secret }) {
  try {
    if (!signature) {
      return { valid: false, error: 'Missing X-Signature header' };
    }

    if (!secret) {
      return { valid: false, error: 'Webhook secret not configured' };
    }

    // Parse signature header: "ts=<timestamp>,v1=<signature>"
    const signatureParts = {};
    signature.split(',').forEach(part => {
      const [key, value] = part.split('=');
      signatureParts[key] = value;
    });

    const { ts, v1 } = signatureParts;

    if (!ts || !v1) {
      return { valid: false, error: 'Invalid signature format' };
    }

    // Check timestamp to prevent replay attacks (5 minutes tolerance)
    const timestampMs = parseInt(ts, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (Math.abs(now - timestampMs) > fiveMinutes) {
      return { valid: false, error: 'Signature timestamp expired' };
    }

    // Generate expected signature
    // Mercado Pago signature format: HMAC-SHA256(secret, "ts=<timestamp>&data=<body>")
    const message = `ts=${ts}&data=${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(v1),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Signature validation error: ${error.message}` };
  }
}

/**
 * Middleware to validate Mercado Pago webhook signatures
 *
 * @param {Object} options - Middleware options
 * @param {boolean} options.enforce - Whether to enforce validation (default: false)
 * @returns {Function} Express middleware function
 */
export function validateMercadoPagoWebhook(options = {}) {
  return (req, res, next) => {
    const enforce = options.enforce || process.env.MERCADOPAGO_ENFORCE_SIGNATURE === 'true';
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    // Skip validation if not enforced (useful for development/sandbox)
    if (!enforce) {
      return next();
    }

    const signature = req.headers['x-signature'];
    const body = JSON.stringify(req.body);

    const result = validateMercadoPagoSignature({ signature, body, secret });

    if (!result.valid) {
      console.warn(`Webhook signature validation failed: ${result.error}`);
      return res.status(401).json({
        message: 'Invalid webhook signature',
        error: result.error
      });
    }

    next();
  };
}
