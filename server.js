const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Seed API route for populating demo data
const seedFn = require('./seed');
app.get('/api/seed', async (req, res) => {
  try {
    const result = await seedFn();
    res.json({ message: 'Database seeded successfully with demo projects & tasks!', result });
  } catch (err) {
    res.status(500).json({ error: 'Seeding failed: ' + err.message });
  }
});

// SPA Fallback: Serve index.html for all non-API GET requests
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server & Sync Database
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');
  } catch (err) {
    console.error('❌ Unable to connect to configured database:', err.message);
    console.error('Stack trace:', err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 TaskFlow Server is running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser.`);
  });
}

startServer();
