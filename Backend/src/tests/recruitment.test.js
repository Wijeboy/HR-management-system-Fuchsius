import request from 'supertest';
import { app } from '../app.js';

describe('Recruitment API', () => {
  it('GET /api/recruitment/jobs should return 401 or 200', async () => {
    const res = await request(app).get('/api/recruitment/jobs');
    expect([401, 200]).toContain(res.statusCode);
  });
});
