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
});

userSchema.pre('save', async function (next) {
  //ONLY RUN IF PASS WAS ACTUALLY MODIFY
  if (!this.isModified('password')) return next();

  //HASH THE PASSWORD
  this.password = await bcrypt.hash(this.password, 12);
  //DELETE THE CONFIRM PASSWORD
  this.passwordConfirm = undefined;

  next();
});

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

module.exports = mongoose.model('User', userSchema);
