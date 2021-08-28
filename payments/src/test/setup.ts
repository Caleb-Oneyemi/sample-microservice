import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

let mongo: any;

jest.mock("../nats-wrapper.ts");

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
	jest.clearAllMocks();
	const collections = await mongoose.connection.db.collections();

	collections.map(async (collection) => {
		await collection.deleteMany({});
	});
});

afterAll(async () => {
	await mongo.stop();
	await mongoose.connection.close();
});

(global as any).signin = (id?: string) => {
	const payload = {
		id: id || new mongoose.Types.ObjectId().toHexString(),
		email: "test@test.com",
	};

	const token = jwt.sign(payload, process.env.JWT_KEY!);
	const session = JSON.stringify({ jwt: token });
	const base64 = Buffer.from(session).toString("base64");
	return [`express:sess=${base64}`];
};
