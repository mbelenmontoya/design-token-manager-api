import Token from '../models/Token.js';

export const importTokens = async (req, res) => {
  const tokens = req.body;
  if (!Array.isArray(tokens)) {
    return res.status(400).json({ message: 'Expected an array of tokens' });
  }

  let created = 0, updated = 0;
  const errors = [];

  await Promise.all(tokens.map(async (t) => {
    try {
      const { name, value, category, description } = t;
      if (!name || !value) {
        throw new Error('`name` and `value` are required');
      }
      const result = await Token.findOneAndUpdate(
        { name },
        { name, value, category, description },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (result.createdAt === result.updatedAt) created++;
      else updated++;
    } catch (err) {
      errors.push({ name: t.name || '(missing name)', error: err.message });
    }
  }));

  res.json({ created, updated, errors });
};

