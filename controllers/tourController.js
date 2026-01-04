const fs = require('fs');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures.js');

//UTILS
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError.js');

//MIDDLEWARE
// exports.checkId = (req, res, next, value) => {
//   // console.log(`TOur id is: ${value}`);
//   // if (value * 1 >= tours.length) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Invalid ID',
//   //   });
//   // }
//   next();
// };

exports.checkData = (req, res, next) => {
  const tour = req.body;
  if (!tour.name || !tour.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }
  next();
};

//alias for some the most requested
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//ROUTES
exports.getTours = catchAsync(async (req, res, next) => {
  // console.log(req.requestTime);
  //response in jsend format

  //EXECUTE THE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  // const tours = await query;

  return res.status(200).json({
    status: 'success',
    requestTime: req.requestTime,
    results: tours.length, //not in the jsend specification
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //url must be = 127.0.0.1:3000/api/v1/tours/3

  // const id = req.params.id;
  const { id } = req.params;
  const tour = await Tour.findById(id);

  if (!tour) throw new AppError(`Tour with the id ${id} not found`, 404);

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const data = req.body;
  const tour = await Tour.create(data);
  return res.status(201).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.editTour = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const tour = await Tour.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour)
    throw new AppError(
      `Can not edit error with id: ${id} because was not found`,
      404,
    );

  return res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // const tourId = req.params.id;
  const { id } = req.params;

  const tour = await Tour.findByIdAndRemove(id);

  if (!tour) throw new AppError(`Could not find error with id ${id}`);

  return res.status(204).json({
    status: 'sucess',
    data: null,
  });
});

//MIDDLEWARE TO PREPARE FILTER
exports.filterTour = async (req, res, next) => {
  //MIDDLEWARE to SEPARATE the QUERY DATA from the SPETIAL VALUES
  // FOR PAGINATION, LIMITS, SORTS, ETC
  if (!req.query) return next();
  // console.log(req.query)
  // take the original req.query and create a copy
  req.queryObject = { ...req.query };

  //fields to exclude
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((el) => delete req.queryObject[el]);

  //ADVANCE FILTERING

  //GENERATE A STRING FROM THE req.queryObject
  let queryStr = JSON.stringify(req.queryObject);
  //REPLACE WITH A REGULAR EXPRESION
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
  //req.queryObject now will be the queryStr parsed to JSON
  req.queryObject = JSON.parse(queryStr);

  //SORTING
  // if(req.query.sort){
  //   req.queryObject =
  // }
  return next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  return res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: {
          $push: '$name',
        },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12, //not necessary but just as a reference
    },
  ]);

  return res.status(200).json({
    status: 'success',
    data: { plan },
  });
});
