const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Routes
router.get('/users', adminController.getAllUsers);
router.get('/reports', adminController.getAllReports);
router.put('/reports/:id', adminController.updateReport);
router.delete('/reports/:id', adminController.deleteReport);
router.get('/statistics', adminController.getStatistics);
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);
router.put('/notifications/:id/read', adminController.markNotificationRead);
router.delete('/notifications/:id', adminController.dismissNotification);
router.delete('/notifications', adminController.dismissAllNotifications);
router.get('/prices', adminController.getAllPrices);
router.post('/prices', upload.single('image'), adminController.createPrice);
router.put('/prices/:id', upload.single('image'), adminController.updatePrice);
router.delete('/prices/:id', adminController.deletePrice);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Admin profile routes
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);
router.post('/profile/picture', upload.single('profilePicture'), adminController.updateProfilePicture);
router.put('/profile/password', adminController.changeAdminPassword);

module.exports = router;
