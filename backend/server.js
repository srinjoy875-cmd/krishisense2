const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./config/db');
const fs = require('fs');
const path = require('path');

dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for now (dev)
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sensor', require('./routes/sensorRoutes'));
app.use('/api/device', require('./routes/deviceRoutes'));
app.use('/api/irrigation', require('./routes/irrigationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.send('KrishiSense IoT API is running...');
});

// Setup Database Route (Temporary)
app.get('/setup-db', async (req, res) => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    res.send('Database initialized successfully! Tables created. You can now Sign Up.');
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).send('Error initializing database: ' + error.message);
  }
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database Connection Check
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});