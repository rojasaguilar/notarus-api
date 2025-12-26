const express = require('express');

const router = express.Router();

const tourController = require('../controllers/tourController');

// router.param('id', tourController.checkId);

router
  .route('/')
  // .get(tourController.filterTour, tourController.getTours)
  .get(tourController.getTours)
  .post(tourController.checkData, tourController.createTour);
//Main route is '/api/v1/tours', thats why here it's declared only '/'

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

//alias for some the most requested
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getTours);

//to make a param optional, add a '?' after
// app.get('/api/v1/tours/:id/:x?) -> x is optional
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.editTour)
  .delete(tourController.deleteTour);
/*Main route is '/api/v1/tours', thats why here its neccessary to add the 
 portion of the url that contains the param*/

module.exports = router;
