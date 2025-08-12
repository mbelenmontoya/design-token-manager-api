import { DEFAULT_API_VERSION, API_VERSIONS } from '../config/versioning.js';

const versioning = (req, res, next) => {
  const requested = req.headers['api-version'];

  if (requested && !API_VERSIONS[requested]) {
    return res.status(400).json({ message: `Invalid API version: ${requested}` });
  }

  const version = requested && API_VERSIONS[requested] ? requested : DEFAULT_API_VERSION;
  const info = API_VERSIONS[version];

  res.setHeader('API-Version', version);

  if (info.deprecated) {
    res.setHeader('Deprecation', `version=${version}`);
    if (info.sunset) {
      res.setHeader('Sunset', info.sunset);
    }
    if (info.link) {
      res.setHeader('Link', `<${info.link}>; rel="deprecation"`);
    }
  }

  next();
};

export default versioning;
