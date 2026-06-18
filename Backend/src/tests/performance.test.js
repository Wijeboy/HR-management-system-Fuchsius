import request from 'supertest';
import { app } from '../app.js';

describe('Performance API', () => {
  it('GET /api/performance/goals should return 401 or 200', async () => {
    const res = await request(app).get('/api/performance/goals');
    expect([401, 200]).toContain(res.statusCode);
  });
});
