require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const sequelize = require('./config/database');
const logger = require('./utils/logger');

// ⭐ Import models THROUGH index so associations load once
const { Project, Company, Listing, Retirement } = require('./models');

// Routes
const creditRoutes = require('./routes/credit.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const retirementRoutes = require('./routes/retirement.routes');
const explorerRoutes = require('./routes/explorer.routes');

const app = express();

/* =========================
   Middleware
========================= */
app.use(helmet());
app.use(compression());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan('combined', {
    stream: { write: msg => logger.info(msg.trim()) }
  })
);

/* =========================
   Rate Limit
========================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.API_RATE_LIMIT || 100
});

app.use('/api', limiter);

/* =========================
   Routes
========================= */
app.use('/api/credits', creditRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/retirements', retirementRoutes);
app.use('/api/explorer', explorerRoutes);

/* =========================
   Health Check
========================= */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    network: process.env.ALGORAND_NETWORK,
    timestamp: new Date().toISOString()
  });
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

    // ⭐ Important: sync AFTER models + associations loaded
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
