import request from 'supertest';
import { app } from '../app.js';

describe('Leave API', () => {
  it('GET /api/leave/my-leaves should return 401 or 500', async () => {
    const res = await request(app).get('/api/leave/my-leaves');
    expect([401, 500]).toContain(res.statusCode);
  });
});
