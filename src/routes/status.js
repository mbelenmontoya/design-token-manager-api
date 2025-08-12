import express from 'express';
import { DEFAULT_API_VERSION, API_VERSIONS, VERSION_POLICY } from '../config/versioning.js';

const router = express.Router();

router.get('/versioning', (_req, res) => {
  const supported = Object.entries(API_VERSIONS).map(([version, info]) => ({
    version,
    deprecated: info.deprecated,
    sunset: info.sunset,
    link: info.link
  }));

  res.json({
    currentVersion: DEFAULT_API_VERSION,
    supportedVersions: supported,
    policy: VERSION_POLICY,
  });
});

export default router;
