const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

//UTILS
const AppError = require('./utils/appError');

//ERROR CONTROLLER
const globalErrorHandler = require('./controllers/errorController');

//ROUTERS
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLWARES (FOR ALL ROUTES)

//SET SECURITY HTTP HEADERS
//on app.use you pass a function(a middleware)
//NOT A CALL FUNCTION
//but this helmet() returns a function
app.use(helmet());

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //middleware to console.log(route entered and stats)
}

//LIMIT REQUEST FROM SAME IP
const limiter = rateLimit({
  //100 requests from the same IP
  max: 100,
  //In one hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

//if app RESTARTS, then the request count RESETS TOO
app.use('/api', limiter);

//BODY PARSER, READING DATA FROM BODY INTO req.body
app.use(
  express.json({
    limit: '10kb',
  }),
); //middleware to parse body (TO JSON)

//SERVING STATIC FILES
app.use(express.static(`${__dirname}/public`)); //MIDDLEWARE TO SERVE STATIC FILES

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
}); // MIDDLEWARE TO SHOW THE TIME THE REQUEST WAS SEND

// 2) MIDDLEWARE FOR SPECIFIC ROUTES (MY ROUTERS)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//3) MIDDLEWARE FOR NOT HANDLED ROUTES

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on the server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

//ERROR MIDDLEWARE HANDLER
app.use(globalErrorHandler);

// EXPORTING APP SO IT CAN BE USED ON SERVER.JS
module.exports = app;
