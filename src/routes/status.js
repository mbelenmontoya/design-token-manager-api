import express from 'express';
import { DEFAULT_API_VERSION, API_VERSIONS, VERSION_POLICY } from '../config/versioning.js';
import databaseService from '../dal/DatabaseService.js';
import prisma from '../config/prisma.js';

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

/**
 * @swagger
 * /status/database:
 *   get:
 *     summary: Database system status
 *     description: Returns detailed status of the Database Abstraction Layer
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Database status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 initialized:
 *                   type: boolean
 *                 configuration:
 *                   type: object
 *                   properties:
 *                     reads:
 *                       type: string
 *                       enum: [mongo, supabase]
 *                     writes:
 *                       type: string
 *                       enum: [mongo, supabase, dual]
 *                 health:
 *                   type: object
 *                   properties:
 *                     read:
 *                       type: object
 *                     write:
 *                       type: object
 */
router.get('/database', async (_req, res) => {
  try {
    let dalHealth = null;
    let initialized = databaseService.isInitialized;
    
    if (!initialized) {
      try {
        await databaseService.initialize();
        initialized = true;
      } catch (initError) {
        return res.status(503).json({
          initialized: false,
          error: initError.message,
          configuration: { reads: 'unknown', writes: 'unknown' }
        });
      }
    }
    
    dalHealth = await databaseService.healthCheck();
    
    res.json({
      initialized,
      configuration: dalHealth.configuration,
      health: {
        read: dalHealth.read,
        write: dalHealth.write
      },
      migration: {
        status: 'PR #1 - DAL Foundation Complete',
        phase: 'MongoDB Adapter Ready',
        nextPhase: 'Controller Migration (PR #2)'
      }
    });
  } catch (error) {
    res.status(503).json({
      initialized: false,
      error: error.message,
      configuration: { reads: 'unknown', writes: 'unknown' }
    });
  }
});

// Simple Postgres connectivity check via Prisma
router.get('/postgres', async (_req, res) => {
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    const elapsedMs = Date.now() - start;
    res.json({ ok: true, elapsedMs, result });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

export default router;
