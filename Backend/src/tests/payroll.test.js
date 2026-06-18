import request from 'supertest';
import { app } from '../app.js';

describe('Payroll API', () => {
  it('GET /api/payroll should return 401 or 404', async () => {
    const res = await request(app).get('/api/payroll');
    expect([401, 404]).toContain(res.statusCode);
  });
});
