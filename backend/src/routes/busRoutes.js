const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const {
  createRoute,
  getRoutes,
  updateBusLocation,
  getBusLocation,
} = require('../controllers/busController');
const { createRouteSchema, updateLocationSchema } = require('../utils/busSchemas');

const router = express.Router();

// Apply protect to all routes
router.use(protect);

// Routes
router.post('/routes', authorizeRoles('admin'), validate(createRouteSchema), createRoute);
router.get('/routes', getRoutes);
router.post('/location/:routeId', authorizeRoles('transport_staff', 'admin'), validate(updateLocationSchema), updateBusLocation);
router.get('/location/:routeId', getBusLocation);

module.exports = router;
