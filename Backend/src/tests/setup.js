import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ensureSystemUsers } from '../modules/auth/systemUsers.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  // Initialize default users for testing
  await ensureSystemUsers();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
