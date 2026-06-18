import request from 'supertest';
import { app } from '../app.js';

describe('Attendance API', () => {
  it('POST /api/attendance/check-in should return 401 or 404', async () => {
    const res = await request(app).post('/api/attendance/check-in');
    expect([401, 404]).toContain(res.statusCode);
  });
});
