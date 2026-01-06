const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const APIfeatures = require('./../utils/apiFeatures');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });

  console.log(newObj);
  return newObj;
};
const getUsers = catchAsync(async (req, res, next) => {
  const features = new APIfeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;

  res.status(200).json({
    status: 'sucess',
    countData: users.length,
    data: users,
  });
});

const updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user POST's password data
  if (req.body.password || req.body.passwordConfirm)
    throw new AppError(
      'This route is not for password updates. Please use /updateMyPassword',
      400,
    );

  //2) Update user document

  const data = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user._id, data, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) throw new AppError('Token no longer valid', 404);

  res.status(200).json({
    data: {
      user: updatedUser,
    },
  });
});

const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

module.exports = {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
};
