const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'user must have a name'] },
  email: {
    type: String,
    required: [true, 'User must have an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Not a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'User must have a pasword '],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm his password'],
    minLength: 8,
    //ONLY WORKS ON SAVE && CREATE
    validate: {
      message: 'Password does not match',
      validator: function (val) {
        return this.password === val;
      },
    },
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

/*
  MIDDLEWARES MIDDLEWARES MIDDLEWARES
*/

// -- pre('save')

//TO ENCRYPT PASSWORD
userSchema.pre('save', async function (next) {
  //ONLY RUN IF PASS WAS ACTUALLY MODIFY
  if (!this.isModified('password')) return next();

  //HASH THE PASSWORD
  this.password = await bcrypt.hash(this.password, 12);
  //DELETE THE CONFIRM PASSWORD
  this.passwordConfirm = undefined;

  next();
});

//TO SET passwordChangedAt
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  //SOMETIMES, JWT CREATION IS FASTER THAN INSERT ON DB
  // IF JWT CREATES FIRST AND THEN passwordChangedAt is lalter (greater) TOKEN NO VALID
  //TO GARANTEE THAT TOKEN WOULD BE VALID ALWAYS, SUBSTRACT 1 SEC ON passswordChangedAt
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// -- pre('find')
userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

/*
  METHODS METHODS METHODS
*/

//TO VERIFY CORRECT PASSWORD
userSchema.methods.checkPassword = async function (
  candidatePassword,
  userPassword,
) {
  //because password select:false, we cant access this.password
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (!this.passwordChangedAt) return false;

  //DIVIDE IT BECAUSE .getTime() returns MILLISECONDS
  // CONVERT IT INTO A BASE 10 NUMBER
  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10,
  );

  console.log(changedTimestamp, JWTTimestamp);

  //IF JWTTimestamp < changedTimestamp, means pass was change AFTER token CREATION
  //IF FIRST JWT CREATION, THEN CHANGED PASSWORD, THEN NOT VALID
  // SO TOKEN NO LONGER VALID
  return JWTTimestamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
  //TOKEN TO SEND TO USER
  //IS LIKE A RESET PASSWORD USER CAN USE TO CREATE A NEW PASSWORD
  const resetToken = crypto.randomBytes(32).toString('hex');

  //this is the token but encrypted
  //STORED ON THE DATABASE FOR LATER COMPARASSION
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //Date.now returns milliseconds
  //We are adding 10minutes from current date
  // +10 minuts, *60 convert to seconds, *1000 converts to milliseconds
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  //this is the TOKEN WE SEND TO THE USER
  //THE NON ENCRYPTED ONE
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
