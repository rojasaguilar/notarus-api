const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');
const User = require('./../models/userModel');
const Tour = require('./../models/tourModel');
const AppError = require('./../utils/appError');

exports.getReviews = catchAsync(async (req, res) => {
  const { tourId } = req.params;
  const reviews = await Review.find({ tour: tourId });

  res.status(200).json({
    status: 'Success',
    results: reviews.length,
    data: reviews,
  });
});

exports.getReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) throw new AppError(`Review with id: ${id} not found`, 404);

  res.status(200).json({
    status: 'Success',
    data: review,
  });
});

exports.createReview = catchAsync(async (req, res) => {
  const data = req.body;

  const { tourId } = req.params;
  const { _id } = req.user;

  const userExists = await User.findById(_id);

  if (!userExists)
    throw new AppError(
      `The creator of the review with the id: ${_id} does not exists`,
      404,
    );

  const tourExists = await Tour.findById(tourId);

  if (!tourExists)
    throw new AppError(`The tour with the id: ${_id} does not exists`, 404);

  data.tour = tourId;
  data.user = _id;

  const review = await Review.create(data);

  res.status(201).json({
    status: 'Success',
    data: review,
  });
});
