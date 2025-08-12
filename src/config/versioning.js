export const DEFAULT_API_VERSION = '1.0';

export const API_VERSIONS = {
  '1.0': { deprecated: false },
  '0.9': {
    deprecated: true,
    sunset: '2025-01-01',
    link: 'https://example.com/docs/0.9-deprecation'
  }
};

export const VERSION_POLICY = 'Deprecated versions will receive support for 6 months after deprecation.';
