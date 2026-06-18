import request from 'supertest';
import { app } from '../app.js';

describe('Users API Deep Integration Tests', () => {
  let createdEmpId;

  it('POST /api/users should create a new employee', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Test Employee',
        email: 'test.emp@company.com',
        role: 'employee',
        department: 'IT',
        baseSalary: 50000,
        password: 'password123'
      });
    
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.statusCode).toBeLessThan(300);
    expect(res.body.user).toBeDefined();
    
    createdEmpId = res.body.user.employeeId;
  });

  it('POST /api/users should fail if email already exists', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Duplicate Employee',
        email: 'test.emp@company.com', // Duplicate
        role: 'employee',
        password: 'password123'
      });
    
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('GET /api/users should return a list of employees', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data) || Array.isArray(res.body.users) || Array.isArray(res.body)).toBe(true);
  });

  it('PUT /api/users/:employeeId should update employee details', async () => {
    if (!createdEmpId) return; 
    
    const res = await request(app)
      .put(`/api/users/${createdEmpId}`)
      .send({ department: 'HR' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it('DELETE /api/users/:employeeId should remove the employee', async () => {
    if (!createdEmpId) return;
    
    const res = await request(app).delete(`/api/users/${createdEmpId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/users/:employeeId should return 404 for deleted employee', async () => {
    if (!createdEmpId) return;
    
    const res = await request(app).get(`/api/users/${createdEmpId}`);
    expect(res.statusCode).toBeGreaterThanOrEqual(400); // 404 typically
  });
});
