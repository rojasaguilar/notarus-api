// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal then 40 characters'],
      minLength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
      validate: {
        validator: function (val) {
          const regex = /^[a-zA-Z ]*$/;
          return val.match(regex);
        },
        message: 'Tour name must only contain letters',
      },
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      required: true,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //val is the value, in this case priceDiscount
          //return true if the priceDiscount is less then the price
          //this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A image must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: () => Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//VIRTUALS

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// MIDDLEWARES

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
// but not on insertMany()

tourSchema.pre('save', function (next) {
  //this points to the current processing document
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: 'name',
  });
  next();
});

//virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

/*
tourSchema.pre('save', (next) => {
  console.log('Will save document...');
  next();
});

//POST MIDDLEWARES: runs before all pre middlewares are completed
tourSchema.post('save', (doc, next) => {
  console.log(doc);
  next();
});
*/

//QUERY MIDDLEWARE

//TRIGGERS BEFORE FIND IS EXECUTED
// THE QUERY ITSELF IS PROCESSED, NOT THE DOCUMENT
// DOES NOT WORK ON FINDONE
// tourSchema.pre('find', function (next) {
//   //this HERE IS A QUERY OBJECT
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

//TO BE ABLE TO USE IN ALL FIND QUERIES (findOne, findById, etc)
// USE A REGEX
tourSchema.pre(/^find/, function (next) {
  //this HERE IS A QUERY OBJECT
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

//AGGREGATION MIDDLEWARES
tourSchema.pre('aggregate', function (next) {
  //this points towards the aggregate object
  // console.log(this.pipeline());

  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

module.exports = mongoose.model('Tour', tourSchema);
