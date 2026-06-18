import request from 'supertest';
import { app } from '../app.js';

describe('Auth API Deep Integration Tests', () => {
  let adminToken;

  describe('POST /api/auth/login', () => {
    it('should successfully login as admin with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@company.com', password: 'admin' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('admin');
      
      adminToken = res.body.token; // Save token for future tests
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@company.com', password: 'wrongpassword' });
      
      expect(res.statusCode).toBeGreaterThanOrEqual(400); 
      expect(res.body.message).toBeDefined();
    });

    it('should fail login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@company.com', password: 'password123' });
      
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.message).toBeDefined();
    });

    it('should fail login when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@company.com' });
      
      expect(res.statusCode).toBeGreaterThanOrEqual(400); 
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('admin@company.com');
    });

    it('should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('should return 401 Unauthorized with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer invalid.token.string`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile details with valid token', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '1234567890', location: 'New Office' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.phone).toBe('1234567890');
      expect(res.body.user.location).toBe('New Office');
    });

    it('should return 401 Unauthorized when updating without token', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ phone: '1234567890' });
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout and return 200', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Logged out');
    });
  });
});
