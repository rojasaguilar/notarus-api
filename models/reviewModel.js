const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      minlength: 4,
      maxlength: 260,
      trim: true,
    },
    rating: {
      type: Number,
      min: [1, 'The min value for a movie is 1'],
      max: [5, 'The max review for a movie is 5'],
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a User'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email',
  });

  this.populate({
    path: 'tour',
    select: 'name photo',
  });
  next();
});

module.exports = mongoose.model('Review', reviewSchema);
