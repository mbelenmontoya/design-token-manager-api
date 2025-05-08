import Token from '../models/Token.js';

// @desc    Get all tokens
// @route   GET /api/tokens
// @access  Public
export const getTokens = async (req, res) => {
    // 1. Parse & default page/limit
  const page     = parseInt(req.query.page,  10) || 1;
  const limit    = parseInt(req.query.limit, 10) || 20;
  const category = req.query.category;

  // 2. Build the filter
  const filter = category ? { category } : {};

  // 3. Get total count before pagination
  const total = await Token.countDocuments(filter);

  // 4. Fetch the paged tokens
  const tokens = await Token.find(filter)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // 5. Compute total pages
  const pages = Math.ceil(total / limit);

  // 6. Return everything
  res.json({ tokens, total, page, limit, pages });
};

// @desc    Create a new token
// @route   POST /api/tokens
// @access  Public (you can lock this down later)
export const createToken = async (req, res) => {
  const { name, value, category, description } = req.body;

  const exists = await Token.findOne({ name });
  if (exists) {
    return res.status(400).json({ message: 'Token with that name already exists' });
  }

  const token = await Token.create({ name, value, category, description });
  res.status(201).json(token);
};

// @desc    Update a token
// @route   PUT /api/tokens/:id
// @access  Public
export const updateToken = async (req, res) => {
  const token = await Token.findById(req.params.id);
  if (!token) {
    return res.status(404).json({ message: 'Token not found' });
  }

  Object.assign(token, req.body);
  const updated = await token.save();
  res.json(updated);
};

// @desc    Delete a token
// @route   DELETE /api/tokens/:id
// @access  Public
export const deleteToken = async (req, res, next) => {
    try {
        const deleted = await Token.findByIdAndDelete(req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: 'Token not found' });
        }
        res.json({ message: 'Token removed' });
      } catch (err) {
        next(err);
      }
};
