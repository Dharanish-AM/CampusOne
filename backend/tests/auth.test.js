const request = require('supertest');
const server = require('../src/index');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Faculty = require('../src/models/Faculty');

describe('Authentication API Test Suite', () => {
  const testStudent = {
    name: 'Auth Student',
    email: 'auth_student@campus.edu',
    password: 'studentpassword123',
    role: 'student',
    rollNumber: 'ROLL-1234',
    department: 'Information Technology',
    semester: 3,
    batch: '2024-2028',
  };

  const testFaculty = {
    name: 'Auth Faculty',
    email: 'auth_faculty@campus.edu',
    password: 'facultypassword123',
    role: 'faculty',
    employeeId: 'FAC-1234',
    department: 'Information Technology',
    designation: 'Assistant Professor',
  };

  it('should successfully register a student user and create their profile', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send(testStudent);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe(testStudent.email);
    expect(res.body.data.accessToken).toBeDefined();

    // Verify DB
    const student = await Student.findOne({ rollNumber: testStudent.rollNumber });
    expect(student).not.toBeNull();
    expect(student.department).toBe(testStudent.department);
  });

  it('should successfully register a faculty user and create their profile', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send(testFaculty);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe(testFaculty.email);

    // Verify DB
    const faculty = await Faculty.findOne({ employeeId: testFaculty.employeeId });
    expect(faculty).not.toBeNull();
    expect(faculty.designation).toBe(testFaculty.designation);
  });

  it('should reject registration if email already exists', async () => {
    // Register once
    await request(server).post('/api/auth/register').send(testStudent);

    // Register again
    const res = await request(server)
      .post('/api/auth/register')
      .send(testStudent);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('email already exists');
  });

  it('should successfully log in a registered user and return tokens', async () => {
    await request(server).post('/api/auth/register').send(testStudent);

    const res = await request(server)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: testStudent.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should reject login with incorrect credentials', async () => {
    await request(server).post('/api/auth/register').send(testStudent);

    const res = await request(server)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should successfully refresh access tokens using a valid refresh token', async () => {
    await request(server).post('/api/auth/register').send(testStudent);

    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: testStudent.password,
      });

    const { refreshToken } = loginRes.body.data;

    const refreshRes = await request(server)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.status).toBe('success');
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
  });

  it('should revoke access on logout', async () => {
    await request(server).post('/api/auth/register').send(testStudent);

    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: testStudent.password,
      });

    const { accessToken, refreshToken } = loginRes.body.data;

    const logoutRes = await request(server)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('Successfully logged out');

    // Try to access protected route with the logged out token
    const protectedRes = await request(server)
      .get('/api/timetable') // protected route
      .set('Authorization', `Bearer ${accessToken}`);

    expect(protectedRes.status).toBe(401);
  });
});
