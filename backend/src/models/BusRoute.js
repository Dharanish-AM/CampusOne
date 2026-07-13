const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      unique: true,
      trim: true,
    },
    routeCode: {
      type: String,
      required: [true, 'Route code is required (e.g. "ROUTE-A")'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    stops: [
      {
        name: {
          type: String,
          required: [true, 'Stop name is required'],
          trim: true,
        },
        latitude: {
          type: Number,
          required: [true, 'Stop latitude is required'],
        },
        longitude: {
          type: Number,
          required: [true, 'Stop longitude is required'],
        },
      },
    ],
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

const BusRoute = mongoose.model('BusRoute', busRouteSchema);

module.exports = BusRoute;
