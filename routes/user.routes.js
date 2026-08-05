const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/users/search?query=...
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query || req.query.email || '';
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { email: { [Op.like]: `%${query}%` } },
          { name: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'email'],
      limit: 10
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Search failed: ' + err.message });
  }
});

module.exports = router;
