import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { app } from "../app";
import request from "supertest";

let mongo: any;

beforeAll(async () => {
	process.env.JWT_KEY = "tEsTsEcReT";
	mongo = await MongoMemoryServer.create();
	const mongoUri = mongo.getUri();

	await mongoose.connect(mongoUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
});

beforeEach(async () => {
	const collections = await mongoose.connection.db.collections();

	collections.map(async (collection) => {
		await collection.deleteMany({});
	});
});

afterAll(async () => {
	await mongo.stop();
	await mongoose.connection.close();
});

(global as any).signin = async () => {
	const email = "test@test.com";
	const password = "password";

	const response = await request(app)
		.post("/api/users/signup")
		.send({ email, password })
		.expect(201);

  const cookie = response.get('Set-Cookie');
  return cookie
};