import databaseService from '../dal/DatabaseService.js';

export const getReleaseTokens = async (req, res) => {
  const { semver } = req.params;
  const { theme = 'base', format = 'json' } = req.query;
  const releases = await databaseService.findTokenReleases({ version: semver, theme, format, limit: 1 });
  const release = Array.isArray(releases) && releases.length > 0 ? releases[0] : null;
  if (!release) {
    return res.status(404).json({ message: 'Release not found' });
  }

  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('ETag', release.checksum);

  if (req.headers['if-none-match'] === release.checksum) {
    return res.status(304).end();
  }

  res.json(release.tokens);
};

export const getReleaseManifest = async (req, res) => {
  const { semver } = req.params;
  const { theme = 'base', format = 'json' } = req.query;
  const releases = await databaseService.findTokenReleases({ version: semver, theme, format, limit: 1 });
  const release = Array.isArray(releases) && releases.length > 0 ? releases[0] : null;
  if (!release) {
    return res.status(404).json({ message: 'Release not found' });
  }

  const manifest = {
    version: release.version,
    theme: release.theme,
    format: release.format,
    checksum: release.checksum,
    date: release.date,
    compatibility: release.compatibility,
  };

  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('ETag', release.checksum);

  if (req.headers['if-none-match'] === release.checksum) {
    return res.status(304).end();
  }

  res.json(manifest);
};
