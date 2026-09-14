const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const socket = require('socket.io');
const pino = require('pino');

const config = require('./config/configs');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Use Node's default promise instead of Mongoose's promise library
mongoose.Promise = global.Promise;

let db = mongoose.connection;

db.on('open', () => {
  logger.info('Connected to the database.');
});

db.on('error', (err) => {
  logger.error({ err }, 'Database error');
});

const createApp = () => {
  const app = express();

  // We are using this for the express-rate-limit middleware.
  app.set('trust proxy', 1);

  // Set public folder using built-in express.static middleware
  app.use(express.static('public'));

  // Set body parser middleware
  app.use(bodyParser.json());

  // Enable cross-origin access through the CORS middleware
  // NOTICE: For React development server only!
  if (process.env.CORS) {
    app.use(cors());
  }

  // Initialize routes middleware
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState });
  });

  app.use('/api/users', require('./routes/users'));

  // Use express's default error handling middleware
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    res.status(400).json({ err: err.message || err });
  });

  return app;
};

const startServer = async () => {
  await mongoose.connect(config.db);
  const app = createApp();
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    logger.info({ port }, 'Listening for HTTP requests');
  });

  const io = socket(server, {
    cors: {
      origin: config.react_app_url,
    }
  });
  let online = 0;

  io.on('connection', (client) => {
    online++;
    logger.info({ socketId: client.id, online }, 'Socket connected');
    io.emit('visitor enters', online);

    client.on('add', data => client.broadcast.emit('add', data));
    client.on('update', data => client.broadcast.emit('update', data));
    client.on('delete', data => client.broadcast.emit('delete', data));

    client.on('disconnect', () => {
      online--;
      logger.info({ socketId: client.id, online }, 'Socket disconnected');
      io.emit('visitor exits', online);
    });
  });

  return server;
};

if (require.main === module) {
  startServer().catch((err) => {
    logger.fatal({ err }, 'Unable to start server');
    process.exitCode = 1;
  });
}

module.exports = { createApp, startServer };