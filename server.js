// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  //CATCHES ALL SYNC EXCEPTIONS LIKE PRINTING A VARIABLE THAT DOESN'T EXISTS...
  console.log(err.name, err.message);

  console.log('UNCAUGTH EXCEPTIONS! 🩸 Shutting down...');

  //HERE WE DON'T WANT TO RESTART THE SERVER
  //DO CRASH DE APP PURPOSELY
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_URL.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

const connectDB = async () => {
  await mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
};

connectDB().then('MongoDB connected');

const app = require('./app');

const port = process.env.PORT || 3000;
// 4) START THE SERVER

//ASIGN THE SERVER TO A CONST
const server = app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

//CATCH UNHANDLED PROMISES
// PROMISES WITH NO CATCH IN ALL THE APPLICATION
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);

  console.log('UNHANDLER REJECTION! 🔥 Shutting donwn...');

  //CLOSE THE SERVER AND THEN EXIT THE APP
  //CLOSING THE SERVER WILL KILL ALL THE PENDING REQUESTS
  server.close(() => process.exit(1));

  //IS BETTER TO IMPLEMENT A MECHANISM TO RESTART THE SERVER
});

//TO INVOKE A EXCEPTION
// console.log(x);
