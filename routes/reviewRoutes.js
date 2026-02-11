const { Router } = require('express');

const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = Router({ mergeParams: true });

router
  .route('/')
  .get(authController.protect, reviewController.getReviews)
  .post(authController.protect, reviewController.createReview);

router.route('/:id').get(authController.protect, reviewController.getReview);

module.exports = router;
