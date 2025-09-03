import prisma from '../../src/config/prisma.js';
import { get } from '../helpers/httpClient.js';

describe('Supabase: Token releases', () => {
  const version = 'test-' + Date.now();
  const theme = 'base';
  const format = 'json';
  let releaseId;

  beforeAll(async () => {
    const release = await prisma.tokenRelease.create({
      data: {
        version,
        theme,
        format,
        tokens: { color: { primary: '#fff' } },
        checksum: 'abc123',
        compatibility: ['v1'],
      },
    });
    releaseId = release.id;
  });

  afterAll(async () => {
    if (releaseId) {
      await prisma.tokenRelease.delete({ where: { id: releaseId } });
    }
  });

  test('GET tokens and manifest', async () => {
    const t = await get(`/v/${version}/tokens?theme=${theme}&format=${format}`);
    expect(t.status).toBe(200);

    const m = await get(`/v/${version}/manifest.json?theme=${theme}&format=${format}`);
    expect(m.status).toBe(200);
    expect(m.body.version).toBe(version);
  });
});

