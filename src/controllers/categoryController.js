import Category from '../models/Category.js';

export const getCategories = async (_, res) => {
    const cats = await Category.find().sort({ name: 1 });
    res.json(cats.map(c => c.name));
  };

  export const createCategory = async (req, res, next) => {
    try {
      const { name } = req.body;
      const cat = await Category.create({ name });
      res.status(201).json(cat);
    } catch (err) {
      next(err);
    }
  };

  // add updateCategory and deleteCategory later
