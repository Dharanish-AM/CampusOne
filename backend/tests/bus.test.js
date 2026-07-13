const request = require('supertest');
const server = require('../src/index');
const BusRoute = require('../src/models/BusRoute');
const BusLocation = require('../src/models/BusLocation');

describe('Bus Tracking API Test Suite', () => {
  let studentToken = '';
  let adminToken = '';
  let driverToken = '';
  let driverId = '';
  let routeId = '';

  beforeEach(async () => {
    // 1. Create student
    const studentRes = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Bus Student',
        email: 'stud_bus@campus.edu',
        password: 'studentpassword123',
        role: 'student',
        rollNumber: 'ROLL-BUS',
        department: 'Information Technology',
        semester: 3,
        batch: '2024-2028',
      });
    studentToken = studentRes.body.data.accessToken;

    // 2. Create driver
    const driverRes = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Bus Driver Joe',
        email: 'driver_joe@campus.edu',
        password: 'driverpassword123',
        role: 'transport_staff',
      });
    driverToken = driverRes.body.data.accessToken;
    driverId = driverRes.body.data.user.id;

    // 3. Create Admin
    const adminRes = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Bus Admin',
        email: 'admin_bus@campus.edu',
        password: 'adminpassword123',
        role: 'admin',
      });
    adminToken = adminRes.body.data.accessToken;

    // 4. Admin creates a Bus Route
    const routeRes = await request(server)
      .post('/api/bus/routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        routeName: 'Campus Shuttle North',
        routeCode: 'RT-NORTH',
        driverId,
        stops: [
          { name: 'Campus Gate', latitude: 12.9716, longitude: 77.5946 },
          { name: 'Hostel Block A', latitude: 12.9800, longitude: 77.6000 },
        ],
      });
    routeId = routeRes.body.data._id;
  });

  it('should allow admin to seed routes', async () => {
    expect(routeId).toBeDefined();
    const route = await BusRoute.findById(routeId);
    expect(route).not.toBeNull();
    expect(route.routeCode).toBe('RT-NORTH');
  });

  it('should allow student to fetch all active routes', async () => {
    const res = await request(server)
      .get('/api/bus/routes')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].routeName).toBe('Campus Shuttle North');
  });

  it('should allow driver to post coordinate update logs', async () => {
    const res = await request(server)
      .post(`/api/bus/location/${routeId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        latitude: 12.9750,
        longitude: 77.5950,
        occupancy: 18,
        speed: 40,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.occupancy).toBe(18);

    const check = await BusLocation.findOne({ routeId });
    expect(check).not.toBeNull();
    expect(check.latitude).toBe(12.9750);
  });

  it('should reject location updates from unauthorized roles (students)', async () => {
    const res = await request(server)
      .post(`/api/bus/location/${routeId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        latitude: 12.9750,
        longitude: 77.5950,
        occupancy: 18,
        speed: 40,
      });

    expect(res.status).toBe(403);
  });

  it('should allow students to retrieve live coordinates of a specific bus', async () => {
    // Post coordinates
    await request(server)
      .post(`/api/bus/location/${routeId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        latitude: 12.9750,
        longitude: 77.5950,
        occupancy: 18,
        speed: 40,
      });

    const res = await request(server)
      .get(`/api/bus/location/${routeId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.latitude).toBe(12.9750);
  });
});
