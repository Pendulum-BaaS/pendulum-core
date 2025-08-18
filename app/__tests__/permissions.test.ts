import supertest from "supertest";
import app from "../src/app";

jest.mock('../src/utils/eventClient');

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

const testDoc = {
  name: 'Test Item',
  description: 'A test document',
  status: 'active',
};

describe('Permissions Happy Path', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await request.post('/pendulum/auth/register').send(userData);
    const loginResponse = await request.post('/pendulum/auth/login').send(loginData);
    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.userId;
  });

  describe('User Data Access', () => {
    it('user can create and access their own documents', async () => {
      // Create document
      const createResponse = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'user_items',
          newItems: [testDoc]
        })
        .expect(201);

      expect(createResponse.body).toHaveLength(1);
      expect(createResponse.body[0]).toMatchObject({
        name: 'Test Item',
        description: 'A test document',
        status: 'active'
      });

      // Can read it back
      const readResponse = await request
        .get('/pendulum/api?collection=user_items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(readResponse.body).toHaveLength(1);
      expect(readResponse.body[0].name).toBe('Test Item');
    });

    it('user can update their own documents', async () => {
      // Create document
      const createResponse = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'user_items',
          newItems: [testDoc]
        });

      const docId = createResponse.body[0]._id;

      // Update document
      const updateResponse = await request
        .patch(`/pendulum/api/${docId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'user_items',
          updateOperation: { $set: { name: 'Updated Item', status: 'completed' } }
        })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        name: 'Updated Item',
        status: 'completed',
        description: 'A test document' // unchanged field
      });
    });

    it('user can delete their own documents', async () => {
      // Create document
      const createResponse = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'user_items',
          newItems: [testDoc]
        });

      const docId = createResponse.body[0]._id;

      // Delete document
      const deleteResponse = await request
        .delete(`/pendulum/api/${docId}?collection=user_items`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        name: 'Test Item',
        _id: docId
      });

      // Verify it's gone
      const readResponse = await request
        .get('/pendulum/api?collection=user_items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(readResponse.body).toHaveLength(0);
    });
  });

  describe('Document Ownership', () => {
    it('documents have correct ownership metadata', async () => {
      const response = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'ownership_test',
          newItems: [{ name: 'Ownership Test' }]
        })
        .expect(201);

      const document = response.body[0];
      expect(document).toMatchObject({
        name: 'Ownership Test',
        userId: userId,
        createdBy: userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      // Timestamps should be valid dates
      expect(new Date(document.createdAt).getTime()).toBeGreaterThan(0);
      expect(new Date(document.updatedAt).getTime()).toBeGreaterThan(0);
    });

    it('preserves ownership on updates', async () => {
      // Create document
      const createResponse = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'ownership_test',
          newItems: [{ name: 'Original Name' }]
        });

      const docId = createResponse.body[0]._id;
      const originalCreatedAt = createResponse.body[0].createdAt;

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update document
      const updateResponse = await request
        .patch(`/pendulum/api/${docId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'ownership_test',
          updateOperation: { $set: { name: 'Updated Name' } }
        })
        .expect(200);

      const updatedDoc = updateResponse.body;
      expect(updatedDoc).toMatchObject({
        name: 'Updated Name',
        userId: userId, // Original owner preserved
        createdBy: userId, // Original creator preserved
        createdAt: originalCreatedAt, // Original creation time preserved
        updatedBy: userId, // Updated by same user
        updatedAt: expect.any(String)
      });

      // Updated time should be different from created time
      expect(updatedDoc.updatedAt).not.toBe(originalCreatedAt);
    });
  });

  describe('Authentication Requirements', () => {
    it('allows public access to collections with default permissions', async () => {
      // No authorization header - should work as anonymous public user
      const response = await request
        .post('/pendulum/api')
        .send({
          collection: 'public_test_items',
          newItems: [testDoc]
        })
        .expect(201);

      expect(response.body[0]).toMatchObject({
        name: 'Test Item',
        userId: 'anonymous' // Public user gets 'anonymous' as userId
      });

      // Should be able to read it back too
      await request
        .get('/pendulum/api?collection=public_test_items')
        .expect(200);
    });
  });

  describe('Collection Auto-Creation', () => {
    it('automatically creates collections on first use', async () => {
      const newCollectionName = 'auto_created_collection';

      // First use should create the collection
      const response = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: newCollectionName,
          newItems: [{ name: 'First Item' }]
        })
        .expect(201);

      expect(response.body[0]).toMatchObject({
        name: 'First Item',
        userId: userId
      });

      // Should be able to access it again
      const readResponse = await request
        .get(`/pendulum/api?collection=${newCollectionName}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(readResponse.body).toHaveLength(1);
    });
  });
});
