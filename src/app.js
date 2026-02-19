require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const sequelize = require('./config/database');
const logger = require('./utils/logger');

// ⭐ Import models (loads associations once)
require('./models');

// Routes
const creditRoutes = require('./routes/credit.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const retirementRoutes = require('./routes/retirement.routes');
const explorerRoutes = require('./routes/explorer.routes');
const userRoutes = require('./routes/user.routes'); // NEW
const ipfsRoutes = require('./routes/ipfs.routes'); // NEW

const app = express();

/* =========================
   Middleware
========================= */
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));


app.use(compression());

// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://carbon-emmision-footprint-marketpla.vercel.app'], // Add your frontend local dev URLs here
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-wallet-address', 'Accept'],
//   credentials: true
// }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://carbon-emmision-footprint-marketpla.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-wallet-address']
}));

// ⭐ IMPORTANT: handle preflight
app.options('*', cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan('combined', {
    stream: { write: msg => logger.info(msg.trim()) }
  })
);

/* =========================
   Rate Limit (applies to API)
========================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.API_RATE_LIMIT || 100
});

app.use('/api', limiter);

/* =========================
   API Root (prevents Cannot GET /api)
========================= */
app.get('/api', (req, res) => {
  res.json({
    message: '🌍 Carbon Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      credits: '/api/credits',
      marketplace: '/api/marketplace',
      retirements: '/api/retirements',
      explorer: '/api/explorer',
      users: '/api/users', // NEW
      ipfs: '/api/ipfs'    // NEW
    }
  });
});

/* =========================
   Health Check
========================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    network: process.env.ALGORAND_NETWORK,
    timestamp: new Date().toISOString()
  });
});

/* =========================
   Routes
========================= */
app.use('/api/credits', creditRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/retirements', retirementRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/users', userRoutes); // NEW
app.use('/api/ipfs', ipfsRoutes);  // NEW
/* =========================
   Root Redirect (optional)
========================= */
app.get('/', (req, res) => {
  res.redirect('/api');
});

/* =========================
   Error Handler
========================= */
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

/* =========================
   Start Server
========================= */
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    await sequelize.sync({ alter: true });
    logger.info('✅ Database synchronized');

    app.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════╗
║ 🌍 Carbon Marketplace Backend               ║
║ 🚀 Running on port ${PORT}                   ║
║ 🔗 Network: ${process.env.ALGORAND_NETWORK}  ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
