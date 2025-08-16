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

describe('CRUD Operations', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await request.post('/pendulum/auth/register').send(userData);

    const loginResponse = await request
      .post('/pendulum/auth/login')
      .send(loginData);

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.userId;
  });

  describe('Create Documents', () => {
    it('creates a new document', async () => {
      const response = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          newItems: [testDoc],
        })
        .expect(201);

      expect(response.body).toEqual(expect.any(Array));
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        _id: expect.any(String),
        name: 'Test Item',
        description: 'A test document',
        status: 'active',
        userId: userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        createdBy: userId,
      });
    });
  });

  describe('Read Documents', () => {
    it('retrieves all documents from collection', async () => {
      await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          newItems: [testDoc],
        });
      
      const response = await request
        .get('/pendulum/api?collection=test_items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual(expect.any(Array));
      expect(response.body).toHaveLength(1);

      expect(response.body[0]).toMatchObject({
        name: 'Test Item',
        description: 'A test document',
        status: 'active',
        userId: userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        createdBy: userId,
        _id: expect.any(String),
      });
    });

    it('retrieves single document by ID', async () => {
      const insertedDoc = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          newItems: [testDoc],
        });

      const documentId = insertedDoc.body[0]._id;

      const response = await request
        .get(`/pendulum/api/${documentId}?collection=test_items`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0]).toMatchObject({
        name: 'Test Item',
        description: 'A test document',
        status: 'active',
        userId: userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        createdBy: userId,
        _id: documentId,
      });
    });
  });

  describe('Update Documents', () => {
    it('updates a single document by ID', async () => {
      const insertedDoc = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          newItems: [testDoc]
        });

      const documentId = insertedDoc.body[0]._id;
      const updateData = {
        $set: {
          name: 'Updated Test Item',
          status: 'completed'
        }
      };

      const response = await request
        .patch(`/pendulum/api/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          updateOperation: updateData
        })
        .expect(200);

      expect(response.body).toMatchObject({
        _id: documentId,
        name: 'Updated Test Item',
        status: 'completed',
        description: 'A test document', // unchanged field
        userId: userId,
        updatedAt: expect.any(String),
        updatedBy: userId
      });
    });

    it('updates multiple documents with filter', async () => {
      await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          newItems: [
            { ...testDoc, status: 'pending' },
            { ...testDoc, name: 'Item 2', status: 'pending' },
            { ...testDoc, name: 'Item 3', status: 'do not update' },
          ]
        });

      const updateData = {
        $set: {
          status: 'processed'
        }
      };

      const response = await request
        .patch('/pendulum/api/some')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          filter: { status: 'pending' },
          updateOperation: updateData
        })
        .expect(200);

      expect(response.body).toEqual(expect.any(Array));
      expect(response.body).toHaveLength(2);
      
      response.body.forEach((doc: any) => {
        expect(doc.status).toBe('processed');
        expect(doc.updatedAt).toBeDefined();
        expect(doc.updatedBy).toBe(userId);
      });
    });
  });

  describe('Delete Documents', () => {
    it('deletes a single document by ID', async () => {
      const insertedDoc = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          newItems: [testDoc]
        });

      const documentId = insertedDoc.body[0]._id;

      const response = await request
        .delete(`/pendulum/api/${documentId}?collection=test_items`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        _id: documentId,
        name: 'Test Item',
        description: 'A test document',
        status: 'active',
        userId: userId
      });
    });

    it('deletes multiple documents by IDs', async () => {
      const insertedDocs = await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          newItems: [
            testDoc,
            { ...testDoc, name: 'Item 2' },
            { ...testDoc, name: 'Item 3' },
          ]
        });

      const doc1Id = insertedDocs.body[0]._id;
      const doc2Id = insertedDocs.body[1]._id;

      const response = await request
        .delete(`/pendulum/api/some?collection=test_items&ids=${doc1Id},${doc2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual(expect.any(Array));
      expect(response.body).toHaveLength(2);
      
      expect(response.body[0]._id).toBe(doc1Id);
      expect(response.body[1]._id).toBe(doc2Id);
    });

    it('deletes all documents in collection', async () => {
      await request
        .post('/pendulum/api')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collection: 'test_items',
          newItems: [
            testDoc,
            { ...testDoc, name: 'Item 2' },
            { ...testDoc, name: 'Item 3' },
          ]
        });

      const response = await request
        .delete('/pendulum/api?collection=test_items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual(expect.any(Array));
      expect(response.body).toHaveLength(3);
    });
  });
});
