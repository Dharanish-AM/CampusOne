const BusRoute = require("../models/BusRoute");
const BusLocation = require("../models/BusLocation");
const User = require("../models/User");

// @desc    Create a new bus route
// @route   POST /api/bus/routes
// @access  Private (Admin)
const createRoute = async (req, res, next) => {
  const { routeName, routeCode, stops, driverId } = req.body;

  try {
    // 1. Verify if driver exists and is transport staff
    const driver = await User.findById(driverId);
    if (
      !driver ||
      (driver.role !== "transport_staff" && driver.role !== "admin")
    ) {
      const error = new Error(
        'Driver must have role "transport_staff" or "admin"',
      );
      error.statusCode = 400;
      return next(error);
    }

    // 2. Create route
    const route = await BusRoute.create({
      routeName,
      routeCode,
      stops,
      driverId,
    });

    res.status(201).json({
      status: "success",
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active bus routes
// @route   GET /api/bus/routes
// @access  Private
const getRoutes = async (req, res, next) => {
  try {
    const routes = await BusRoute.find({}).populate("driverId", "name email");
    res.status(200).json({
      status: "success",
      data: routes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bus live location coordinates
// @route   POST /api/bus/location/:routeId
// @access  Private (Transport Staff / Admin)
const updateBusLocation = async (req, res, next) => {
  const { routeId } = req.params;
  const { latitude, longitude, occupancy, speed } = req.body;

  try {
    // 1. Validate route exists
    const routeExists = await BusRoute.findById(routeId);
    if (!routeExists) {
      const error = new Error("Bus route not found");
      error.statusCode = 404;
      return next(error);
    }

    // 2. Upsert coordinates log
    const location = await BusLocation.findOneAndUpdate(
      { routeId },
      { latitude, longitude, occupancy, speed },
      { upsert: true, new: true, runValidators: true },
    );

    // 3. Emit real-time Socket.IO coordinates update to all connected students
    const io = req.app.get("io");
    if (io) {
      io.emit("bus:update", {
        routeId,
        latitude,
        longitude,
        occupancy,
        speed,
        updatedAt: location.updatedAt,
      });
    }

    res.status(200).json({
      status: "success",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current location of a specific route bus
// @route   GET /api/bus/location/:routeId
// @access  Private
const getBusLocation = async (req, res, next) => {
  const { routeId } = req.params;

  try {
    const location = await BusLocation.findOne({ routeId });

    if (!location) {
      return res.status(200).json({
        status: "success",
        data: null,
        message: "Bus is currently offline / no coordinates found.",
      });
    }

    res.status(200).json({
      status: "success",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoute,
  getRoutes,
  updateBusLocation,
  getBusLocation,
};
