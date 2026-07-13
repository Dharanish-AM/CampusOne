const request = require('supertest');
const server = require('../src/index');
const Subject = require('../src/models/Subject');
const Attendance = require('../src/models/Attendance');

describe('Attendance API Test Suite', () => {
  let studentToken = '';
  let facultyToken = '';
  let studentId = '';
  let facultyId = '';
  let subjectId = '';

  beforeEach(async () => {
    // 1. Create student
    const studentRes = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Attendance Student',
        email: 'stud_att@campus.edu',
        password: 'studentpassword123',
        role: 'student',
        rollNumber: 'ROLL-ATT',
        department: 'Computer Science',
        semester: 3,
        batch: '2024-2028',
      });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;

    // 2. Create faculty
    const facultyRes = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Attendance Faculty',
        email: 'fac_att@campus.edu',
        password: 'facultypassword123',
        role: 'faculty',
        employeeId: 'FAC-ATT',
        department: 'Computer Science',
        designation: 'Professor',
      });
    facultyToken = facultyRes.body.data.accessToken;
    facultyId = facultyRes.body.data.profile._id;

    // 3. Create Subject
    const subjectRes = await request(server)
      .post('/api/attendance/subjects')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        name: 'Operating Systems',
        code: 'CS301',
        department: 'Computer Science',
        credits: 4,
      });
    subjectId = subjectRes.body.data._id;
  });

  it('should allow faculty to log attendance logs', async () => {
    const res = await request(server)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        studentId,
        subjectId,
        date: '2026-07-10',
        status: 'present',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('present');

    const check = await Attendance.findOne({ studentId, subjectId });
    expect(check).not.toBeNull();
    expect(check.status).toBe('present');
  });

  it('should successfully update attendance if logged twice for the same student, subject, and date', async () => {
    // Log once
    await request(server)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ studentId, subjectId, date: '2026-07-10', status: 'present' });

    // Log twice (updates status)
    const res = await request(server)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ studentId, subjectId, date: '2026-07-10', status: 'absent' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('absent');

    const check = await Attendance.findOne({ studentId, subjectId });
    expect(check.status).toBe('absent');
  });

  it('should calculate student aggregates and shortage predictions correctly (low attendance case)', async () => {
    // Log 4 classes: 2 present, 2 absent (50% attendance)
    await request(server)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ studentId, subjectId, date: '2026-07-10', status: 'present' });
    await request(server)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ studentId, subjectId, date: '2026-07-11', status: 'present' });
    await request(server)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ studentId, subjectId, date: '2026-07-12', status: 'absent' });
    await request(server)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ studentId, subjectId, date: '2026-07-13', status: 'absent' });

    const res = await request(server)
      .get('/api/attendance/student')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const summary = res.body.data.subjects[0];
    expect(summary.present).toBe(2);
    expect(summary.total).toBe(4);
    expect(summary.percentage).toBe(50);
    expect(summary.percentage < 75).toBe(true);
    expect(summary.prediction.status).toBe('danger');
    
    // Prediction count: 3 * totalClasses - 4 * presentCount = 3 * 4 - 4 * 2 = 12 - 8 = 4 classes
    expect(summary.prediction.value).toBe(4);
  });

  it('should calculate student aggregates and safe miss predictions correctly (high attendance case)', async () => {
    // Log 4 classes: 4 present (100% attendance)
    for (let i = 10; i <= 13; i++) {
      await request(server)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ studentId, subjectId, date: `2026-07-${i}`, status: 'present' });
    }

    const res = await request(server)
      .get('/api/attendance/student')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const summary = res.body.data.subjects[0];
    expect(summary.percentage).toBe(100);
    expect(summary.percentage >= 75).toBe(true);
    expect(summary.prediction.status).toBe('safe');
    
    // Prediction count (safely missable): (4 * presentCount - 3 * totalClasses) / 3 = (4 * 4 - 3 * 4) / 3 = (16 - 12) / 3 = 4 / 3 = 1 class
    expect(summary.prediction.value).toBe(1);
  });
});
