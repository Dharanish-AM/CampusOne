const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const mongoIdSchema = z.string().regex(mongoIdRegex, 'Invalid MongoDB ObjectId format');

const stopSchema = z.object({
  name: z.string({
    required_error: 'Stop name is required',
  }).min(1, 'Stop name cannot be empty'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const createRouteSchema = z.object({
  body: z.object({
    routeName: z.string({
      required_error: 'Route name is required',
    }).min(2, 'Route name must be at least 2 characters long'),
    routeCode: z.string({
      required_error: 'Route code is required',
    }).min(3, 'Route code must be at least 3 characters long'),
    stops: z.array(stopSchema).min(1, 'At least one route stop is required'),
    driverId: mongoIdSchema,
  }),
});

const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number({
      required_error: 'Latitude is required',
    }).min(-90).max(90),
    longitude: z.number({
      required_error: 'Longitude is required',
    }).min(-180).max(180),
    occupancy: z.number().min(0).max(100).optional(),
    speed: z.number().min(0).optional(),
  }),
});

module.exports = {
  createRouteSchema,
  updateLocationSchema,
};
