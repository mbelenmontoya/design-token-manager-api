import databaseService from '../dal/DatabaseService.js';

// @desc    Get all tokens
// @route   GET /api/tokens
// @access  Public
export const getTokens = async (req, res) => {
  // 1. Parse & default page/limit
  const page     = parseInt(req.query.page,  10) || 1;
  const limit    = parseInt(req.query.limit, 10) || 20;
  const category = req.query.category;

  const options = {
    category,
    skip: (page - 1) * limit,
    limit,
  };

  // 2. Get total count and paged tokens via DAL
  const [total, tokens] = await Promise.all([
    databaseService.countTokensByProject(req.projectId, { category }),
    databaseService.findTokensByProject(req.projectId, options),
  ]);

  const pages = Math.ceil(total / limit);
  res.json({ items: tokens, total, pages });
};

// @desc    Create a new token
// @route   POST /api/tokens
// @access  Public (you can lock this down later)
export const createToken = async (req, res, next) => {
  try {
    const { name, value, category, description } = req.body;

    // Upsert category via DAL
    if (category) {
      const existingCat = await databaseService.findCategoryByName(category);
      if (!existingCat) {
        await databaseService.createCategory({ name: category });
      }
    }

    // Check duplicate by name within project via DAL
    const existing = await databaseService.findTokensByProject(req.projectId, { name, limit: 1 });
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'Token with that name already exists' });
    }

    const token = await databaseService.createToken({
      tenant: req.tenantId,
      project: req.projectId,
      name,
      value,
      category,
      description,
    });
    res.status(201).json(token);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a token
// @route   PUT /api/tokens/:id
// @access  Public
export const updateToken = async (req, res, next) => {
  try {
    const token = await databaseService.findTokenById(req.params.id);
    const tTenant = token?.tenantId ?? token?.tenant;
    const tProject = token?.projectId ?? token?.project;
    if (!token || String(tTenant) !== String(req.tenantId) || String(tProject) !== String(req.projectId)) {
      return res.status(404).json({ message: 'Token not found' });
    }

    const updated = await databaseService.updateToken(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a token
// @route   DELETE /api/tokens/:id
// @access  Public
export const deleteToken = async (req, res, next) => {
  try {
    const token = await databaseService.findTokenById(req.params.id);
    const tTenant = token?.tenantId ?? token?.tenant;
    const tProject = token?.projectId ?? token?.project;
    if (!token || String(tTenant) !== String(req.tenantId) || String(tProject) !== String(req.projectId)) {
      return res.status(404).json({ message: 'Token not found' });
    }
    await databaseService.deleteToken(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
