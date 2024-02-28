const express = require('express');
const session = require('express-session');
const nocache = require('nocache');
const logger = require('morgan');

require('dotenv').config();
require('./configs/databaseConnection');
require('./configs/googleAuth');

const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));
app.use(logger('dev'));
app.use(nocache());

app.use('/admin', adminRoute);
app.use('/', userRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}/`));