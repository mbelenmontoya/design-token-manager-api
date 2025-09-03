import databaseService from '../dal/DatabaseService.js';

export const getCategories = async (_, res) => {
    const cats = await databaseService.findAllCategories();
    const sorted = [...cats].sort((a,b) => (a.name||'').localeCompare(b.name||''));
    res.json(sorted.map(c => c.name));
  };

  export const createCategory = async (req, res, next) => {
    try {
      const { name } = req.body;
      const existing = await databaseService.findCategoryByName(name);
      if (existing) return res.status(200).json(existing);
      const cat = await databaseService.createCategory({ name });
      res.status(201).json(cat);
    } catch (err) {
      next(err);
    }
  };

  // add updateCategory and deleteCategory later
