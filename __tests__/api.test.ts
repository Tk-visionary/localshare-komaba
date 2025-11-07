import request from 'supertest';
import app from '../app';
import admin from 'firebase-admin';

import { Request, Response, NextFunction } from 'express';

// Mock the auth middleware to bypass actual authentication
jest.mock('../middleware/auth.js', () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    req.user = { uid: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

const PROJECT_ID = 'sample-ugip-ai-app';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8181';

import axios from 'axios';

beforeAll(async () => {
  // Pre-populate a dummy user for tests that require a user
  // The admin SDK will automatically connect to the emulator because of the env vars set by emulators:exec
  const db = admin.firestore();
  await db.collection('users').doc('test-user-id').set({
    name: 'Initial Test User',
    picture: 'initial.jpg'
  });
});

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should respond with a 200 status code and an array of items', async () => {
      const response = await request(app).get('/api/items');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/items', () => {
    const validItemData = {
      name: 'Test Item', description: 'This is a test item.', category: '物品', price: 100,
      imageUrl: 'https://example.com/test.jpg', boothArea: 'A', boothDetail: '101',
      exhibitorName: 'Test Exhibitor',
    };

    it('should create a new item and respond with 201 when given valid data', async () => {
      const response = await request(app).post('/api/items').send(validItemData);
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(validItemData.name);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.name).toBe(validItemData.exhibitorName);
    });

    it('should respond with 400 when required fields are missing', async () => {
      const response = await request(app).post('/api/items').send({ ...validItemData, name: '' });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toHaveProperty('details');
    });
  });

  describe('Item-specific endpoints', () => {
    let createdItem: any;

    beforeAll(async () => {
      const validItemData = {
        name: 'Specific Test Item', description: 'An item for specific tests.', category: '物品', price: 500,
        imageUrl: 'https://example.com/specific.jpg', boothArea: 'B', boothDetail: '202',
        exhibitorName: 'Specific Exhibitor',
      };
      const response = await request(app).post('/api/items').send(validItemData);
      createdItem = response.body;
    });

    it('GET /api/items/:id should fetch a specific item', async () => {
      const response = await request(app).get(`/api/items/${createdItem.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(createdItem.id);
      expect(response.body.name).toBe('Specific Test Item');
    });

    it('GET /api/items/:id should return 404 for a non-existent item', async () => {
      const response = await request(app).get('/api/items/non-existent-id');
      expect(response.statusCode).toBe(404);
    });

    it('PUT /api/items/:id should update an item', async () => {
      const updateData = { name: 'Updated Test Item', price: 600 };
      const response = await request(app).put(`/api/items/${createdItem.id}`).send(updateData);
      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Test Item');
      expect(response.body.price).toBe(600);
    });

    it('DELETE /api/items/:id should delete an item', async () => {
      const response = await request(app).delete(`/api/items/${createdItem.id}`);
      expect(response.statusCode).toBe(204);

      // Verify the item is actually deleted
      const getResponse = await request(app).get(`/api/items/${createdItem.id}`);
      expect(getResponse.statusCode).toBe(404);
    });
  });
});
