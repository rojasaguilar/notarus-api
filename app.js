const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLWARES (FOR ALL ROUTES)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //middleware to console.log(route entered and stats)
}
app.use(express.json()); //middleware to parse body (TO JSON)
app.use(express.static(`${__dirname}/public`)); //MIDDLEWARE TO SERVE STATIC FILES

app.use((req, res, next) => {
  console.log('Hello from the middleware');
  next();
}); // MIDDLEWARE CUSTOM

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
}); // MIDDLEWARE TO SHOW THE TIME THE REQUEST WAS SEND

// 2) MIDDLEWARE FOR SPECIFIC ROUTES (MY ROUTERS)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// EXPORTING APP SO IT CAN BE USED ON SERVER.JS
module.exports = app;
