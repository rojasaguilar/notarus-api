const fs = require('fs');
const Tour = require('./../models/tourModel');

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

//ROUTES
exports.getTours = async (req, res) => {
  // console.log(req.requestTime);
  //response in jsend format

  try {
    const tours = await Tour.find(req.queryObject);
    return res.status(200).json({
      status: 'success',
      requestTime: req.requestTime,
      results: tours.length, //not in the jsend specification
      data: {
        tours,
      },
    });
  } catch (error) {
    return res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getTour = async (req, res) => {
  //url must be = 127.0.0.1:3000/api/v1/tours/3
  try {
    // const id = req.params.id;
    const { id } = req.params;
    const tour = await Tour.findById(id);
    return res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const data = req.body;
    const tour = await Tour.create(data);
    return res.status(201).json({
      status: 'success',
      data: {
        tour: tour,
      },
    });
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.editTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    return res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.deleteTour = async (req, res) => {
  // const tourId = req.params.id;
  const { id } = req.params;
  try {
    const tour = await Tour.findByIdAndRemove(id);
    return res.status(204).json({
      status: 'sucess',
      data: null,
    });
  } catch (error) {
    return res.status(404).json({
      status: 'sucess',
      message: error,
    });
  }
};

//MIDDLEWARE TO PREPARE FILTER
exports.filterTour = async (req, res, next) => {
  //MIDDLEWARE to SEPARATE the QUERY DATA from the SPETIAL VALUES
  // FOR PAGINATION, LIMITS, SORTS, ETC
  if (!req.query) return next();
  // take the original req.query and create a copy
  req.queryObject = { ...req.query };

  //fields to exclude
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((el) => delete req.queryObject[el]);

  //ADVANCE FILTERING

  //GENEERATE A STRING FROM THE req.queryObject
  let queryStr = JSON.stringify(req.queryObject);
  //REPLACE WITH A REGULAR EXPRESION
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
  //req.queryObject now will be the queryStr parsed to JSON
  req.queryObject = JSON.parse(queryStr);
  return next();
};
