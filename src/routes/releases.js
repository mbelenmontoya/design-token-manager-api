import express from 'express';
import { getReleaseTokens, getReleaseManifest } from '../controllers/tokenReleaseController.js';

const router = express.Router();

router.get('/v/:semver/tokens', getReleaseTokens);
router.get('/v/:semver/manifest.json', getReleaseManifest);

export default router;
