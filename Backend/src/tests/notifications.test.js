import request from 'supertest';
import { app } from '../app.js';

describe('Notifications API', () => {
  it('GET /api/notifications should return 401 or 404', async () => {
    const res = await request(app).get('/api/notifications');
    expect([401, 404]).toContain(res.statusCode);
  });
});
