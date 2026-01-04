const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

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

//WRAPPER FUNCTION to have access to custom params
exports.restrictTo =
  (...roles) =>
  //ACTUAL MIDDLEWARE
  (req, res, next) => {
    //roles is an array.
    //are the params we pass on tourRoutes
    if (!roles.includes(req.user.role))
      next(
        new AppError("You don't have permission to perfom this action!", 403),
      );

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });

  if (!user) throw new AppError('Invalid email. Please try another one', 404);
  //2) Generate the random token

  const resetToken = await user.createPasswordResetToken();
  //to save the changes made on the model (the reset token and the expireTime)
  await user.save();

  console.log(resetToken);

  //3) Send it to user's email
  const resetURL = `${req.protocol}://
  ${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new Password 
  and passwordConfirm to: ${resetURL}. \nIf you didn't forget your password, please ignore thise email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log(error);
    throw new AppError('There was an error sending the email', 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) If token has not expired and there is user, set password

  if (!user) throw new AppError('Token no longer valid', 400);

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //3) Update changedPaswordAt property for the user

  user.passwordChangedAt = Date.now();
  await user.save();

  //4) Log the user in, send JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: 'sucess',
    token,
  });
});
