// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_URL.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

const connectDB = async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error(error);
  }
};

connectDB();

const app = require('./app');

const port = process.env.PORT || 3000;
// 4) START THE SERVER
mongoose.connection.once('open', async () => {
  app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
  });
});
