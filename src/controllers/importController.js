import databaseService from '../dal/DatabaseService.js';

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

      if (!name || !value) throw new Error('`name` and `value` are required');

      // Upsert category via DAL
      if (category) {
        const existingCat = await databaseService.findCategoryByName(category);
        if (!existingCat) {
          await databaseService.createCategory({ name: category });
        }
      }

      // Check if token exists by name within project
      const existing = await databaseService.findTokensByProject(req.projectId, { name, limit: 1 });
      if (existing && existing.length > 0) {
        const tokenId = existing[0]._id?.toString?.() || existing[0].id;
        await databaseService.updateToken(tokenId, {
          value,
          category,
          description,
        });
        updated++;
      } else {
        await databaseService.createToken({
          tenant: req.tenantId,
          project: req.projectId,
          name,
          value,
          category,
          description,
        });
        created++;
      }
    } catch (err) {
      errors.push({ name: t.name || '(missing name)', error: err.message });
    }
  }));

  res.json({ created, updated, errors });
};
