// File tag
const tag = 'whisk-management';

// Requirements
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const debug = require('debug')(tag);
const { loginCheck } = require('./src/controllers/authController')();

// App configuration
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ keys: [process.env.SESSION_SECRET] }));
app.set('view engine', 'ejs');

// Paths
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.set('views', './src/views');

// Connect to MongoDB
const dbController = require('./lib/db-control/db-control')(tag);

dbController.connect();

// Configure Passport
require('./src/config/passport.js')(app);

// Routing
const userRouter = require('./src/routes/userRoutes')();
const authRouter = require('./src/routes/authRoutes')();
const adminRouter = require('./src/routes/adminRoutes')();
const treatBoxRouter = require('./src/routes/treatBoxRoutes')();

app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/treatbox', treatBoxRouter);

// Entry Point
app.all('/', loginCheck);
app.get('/', (req, res) => {
  res.redirect('/user/dashboard');
});

// Start Server
app.listen(port, () => {
  debug(`Express server listening on port ${port}...`);
});