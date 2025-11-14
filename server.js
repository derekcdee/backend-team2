const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { getAllowedOrigins, getPort, isProduction, isDevelopment, getDatabaseUrl } = require('./utils/environment');

// Initialize app
const app = express();

// Handle webhook routes with raw body BEFORE applying JSON middleware
const webhook = require('./routes/webhook');
app.use('/webhook', webhook);

// Apply JSON middleware for all other routes
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log('Blocked by CORS:', origin);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware BEFORE all routes
app.use(cors(corsOptions));

// Handle preflight requests for ALL routes
app.options('*', cors(corsOptions));

// const cuePresets = require('./routes/user/cuePresets');
// app.use('/user/cuePresets', cuePresets);

const userPrefs = require('./routes/user/prefs');
app.use('/user/prefs', userPrefs);

if (isDevelopment()) {
  // log all requests for debugging purposes
  app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);

    // capture the original send method
    const originalSend = res.send;

    // override the send method to log the response
    res.send = function (body) {
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', body);
      originalSend.call(this, body);
    };

    next();
  });
}

// Connect to MongoDB
mongoose.connect(getDatabaseUrl(), {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.log('Error connecting to MongoDB:', err);
});

const cues = require('./routes/cue');
app.use('/cues', cues);

const accessories = require('./routes/accessory');
app.use('/accessories', accessories);

const materials = require('./routes/material');
app.use('/materials', materials);

const users = require('./routes/userRoutes');
app.use('/user', users);

const adminCues = require('./routes/admin/cue');
app.use('/admin/cues', adminCues);

const adminAccessories = require('./routes/admin/accessory');
app.use('/admin/accessories', adminAccessories);

const adminMaterials = require('./routes/admin/material');
app.use('/admin/materials', adminMaterials);

const adminOnly = require('./routes/admin/admin');
app.use('/admin', adminOnly);

const orders = require('./routes/admin/order');
app.use('/admin/orders', orders);

const analytics = require('./routes/admin/analytic');
app.use('/admin/analytics', analytics);

const accounts = require('./routes/authorization');
app.use('/account', accounts);

const cart = require('./routes/cart');
app.use('/cart', cart);

const image =  require('./routes/admin/image');
app.use('/admin/image', image);

const payment = require('./routes/payment');
app.use('/order/payment', payment);

const search = require('./routes/search');
app.use('/search', search);

const scripts = require('./routes/admin/scripts');
app.use('/scripts', scripts);

const email = require('./routes/email');
app.use('/email', email)

const adminEmail = require('./routes/admin/adminEmail');
app.use('/admin/email', adminEmail)

const announcements = require('./routes/announcement');
app.use('/announcements', announcements);

const adminAnnouncements = require('./routes/admin/announcement');
app.use('/admin/announcements', adminAnnouncements);

const cuePresets = require('./routes/user/cuePresets');
app.use('/user/cuePresets', cuePresets);

// Sample route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start the server with environment-based configuration
const PORT = getPort();

if (isProduction()) {
  // Production: bind to all interfaces
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`Allowed origins:`, getAllowedOrigins().join(', '));
  });
} else {
  // Development: no host binding (defaults to all interfaces)
  app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`Allowed origins:`, getAllowedOrigins().join(', '));
  });
}