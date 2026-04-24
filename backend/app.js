const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

async function startServer() {
  await initDatabase();
  
  const app = express();
  const PORT = 8080;
  
  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }));
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  - POST /api/auth/login`);
    console.log(`  - POST /api/auth/register`);
    console.log(`  - GET  /api/users`);
    console.log(`  - GET  /api/users/:id`);
    console.log(`  - GET  /api/users/username/:username`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
