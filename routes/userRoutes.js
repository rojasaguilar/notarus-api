const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

//ROUTES FOR ACUTAL USERS (NOT ADMINS)
const router = express.Router();

//ROUTES FOR CREATING USERS AND SO, FOR ADMINISTRATORS
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch('/updateMe', authController.protect, userController.updateMe);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

router.route('/').get(userController.getUsers).post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
