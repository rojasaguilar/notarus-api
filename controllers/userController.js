const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const APIfeatures = require('./../utils/apiFeatures');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });

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

  // FITLER FOR ONLY THE SPECIFIED PROPERTIES
  // IN THIS CASE, ONLY NAME AND EMAIL WOULD BE PERMITTED
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

const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
  });
});

const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const createUser = catchAsync(async (req, res) => {
  const data = req.body;

  const createdUser = await User.create(data);

  res.status(201).json({
    status: 'sucess',
    data: createdUser,
  });
});

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
  deleteMe,
};
