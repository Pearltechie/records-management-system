const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { createApp } = require('../server');
const User = require('../models/user');

let mongoServer;
let app;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApp();
});

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('reports application and database health', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok', database: 1 });
});

test('creates, reads, updates, and deletes a user', async () => {
  const created = await request(app)
    .post('/api/users')
    .send({ name: 'saylor swift', email: 'saylor@example.com', age: 34, gender: 'f' });

  assert.equal(created.status, 201);
  assert.equal(created.body.result.name, 'Saylor Swift');

  const userId = created.body.result._id;
  const listed = await request(app).get('/api/users');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.length, 1);

  const updated = await request(app)
    .put(`/api/users/${userId}`)
    .send({ name: 'Taylor Swift', email: 'saylor@example.com', age: 35, gender: 'f' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.result.age, 35);

  const deleted = await request(app).delete(`/api/users/${userId}`);
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.result._id, userId);
});

test('rejects invalid ages', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ name: 'Young Person', email: 'young@example.com', age: 4, gender: 'm' });

  assert.equal(response.status, 403);
  assert.equal(response.body.msg, 'You\'re too young for this.');
  assert.equal(await User.countDocuments(), 0);
});
