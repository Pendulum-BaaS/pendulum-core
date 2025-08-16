jest.mock('../src/models/mongoClient', () => ({
  mongoClient: null // set in setup
}));

import supertest from 'supertest';
import app from '../src/app';

const request = supertest(app);

const userData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
};

const loginData = {
  identifier: 'testuser',
  password: 'password123',
};

describe('Authentication', () => {

  describe('User Registration', () => {
    it('registers a new user successfully', async () => {
      const response = await request
        .post('/pendulum/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'User successfully created',
        user: {
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
        },
      });
    });
  });

  describe('User Login', () => {
    it('logs in with valid credentials', async () => {
      await request.post('/pendulum/auth/register').send(userData);

      const response = await request
        .post('/pendulum/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: {
          userId: expect.any(String),
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
        },
        token: expect.any(String),
      });
    });
  });

  describe('Token Validation', () => {
    it('accesses protected route with valid token', async () => {
      await request.post('/pendulum/auth/register').send(userData);

      const loginResponse = await request.post('/pendulum/auth/login').send(loginData);
      const token = loginResponse.body.token;

      const response = await request
        .get('/pendulum/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: {
          userId: expect.any(String),
          role: 'user',
        },
      });
    });
  });

});
