const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./config/db');
const fs = require('fs');
const path = require('path');
const mlService = require('./services/mlService');

dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3005',
  'https://krishisense2.vercel.app',
  'https://krishisense-frontend.vercel.app'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Explicit OPTIONS handling for CORS preflight
app.options('*', cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sensor', require('./routes/sensorRoutes'));
app.use('/api/device', require('./routes/deviceRoutes'));
app.use('/api/irrigation', require('./routes/irrigationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));

// --- ML Routes ---
app.post('/api/ml/recommend', async (req, res) => {
  try {
    const data = req.body;
    const result = await mlService.predict(data);
    res.json(result);
  } catch (err) {
    console.error("ML Route Error:", err.message);
    res.status(500).json({ error: "ML Engine failed", details: err.message });
  }
});

// Note: /monitor is not yet migrated to remote - keeping local for now
// To migrate it, add a /monitor endpoint to server_ml.py
// Note: /monitor is now migrated to the unified ML Service
app.post('/api/ml/monitor', async (req, res) => {
  try {
    const data = req.body;
    const result = await mlService.monitor(data);
    res.json(result);
  } catch (err) {
    console.error("Monitor Error:", err.message);
    res.status(500).json({ error: "Monitor failed", details: err.message });
  }
});

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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} `);
});