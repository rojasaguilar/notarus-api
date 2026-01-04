const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');

const signToken = (payload) => {
  return jwt.sign({ ...payload }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const data = req.body;

  const newUser = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    passwordConfirm: data.passwordConfirm,
  });

  //FOR TESTING FORCE TO PASSWORD CHANGE ON CREATION
  // TO VERIFY IF TOKEN SHOULD BE INVALID
  // const newUser = await User.create(data);

  //CREATE A TOKEN
  //jwt.sign(payload,signature,options)
  //SIGNATURE MUST BE AT LEAST A 32 CHARACTER STRING
  const token = signToken({
    id: newUser._id,
    // email: newUser.email,
  });

  res.status(201).json({
    status: 'sucess',
    token: token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email and password actually exists
  if (!email || !password) {
    throw new AppError('Neither email or password were provided', 400);
  }

  //2) Check if user exits && password is correct
  const user = await User.findOne({ email }).select('+password');

  //user.checkPassword is defined on the MODEL
  //we have to call it from the USER WE QUERY, NOT FROM THE SCHEMA INSTANCE
  if (!user || !(await user.checkPassword(password, user.password)))
    throw new AppError('Incorrect email or password', 401);

  //3) If  everything ok, send token to client
  const token = signToken({
    id: user._id,
  });

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if exists
  let token = req.headers.authorization;

  if (!token || !token.startsWith('Bearer')) {
    throw new AppError('You are not logged in!, please log in', 401);
  }

  token = token.split(' ')[1];

  //2) Verification token
  //promisify COMING FROM util package (built in node.js)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    throw new AppError('Token no longer valid. Please log in again', 401);

  //4) Check if user changed passwords after the token was issued

  if (currentUser.changedPasswordAfter(decoded.iat))
    throw new AppError('Password changed. Please log in again', 401);

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //roles is an array.
    //are the params we pass on tourRoutes
    if (!roles.includes(req.user.role))
      next(
        new AppError("You don't have permission to perfom this action!", 403),
      );

    next();
  };
