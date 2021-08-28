import request from "supertest";
import { app } from "../../app";

it("fails if user does not exist", async () => {
	await request(app)
		.post("/api/users/signin")
		.send({ email: "test@test.com", password: "password" })
		.expect(400);
});

it("fails if password is invalid for existing user", async () => {
	await request(app)
		.post("/api/users/signup")
		.send({ email: "test@test.com", password: "password" })
		.expect(201);

	await request(app)
		.post("/api/users/signin")
		.send({ email: "test@test.com", password: "wrongpassword" })
		.expect(400);
});

it("responds with a cookie when given valid credentials", async () => {
	await request(app)
		.post("/api/users/signup")
		.send({ email: "test@test.com", password: "password" })
		.expect(201);

	let response = await request(app)
		.post("/api/users/signin")
		.send({ email: "test@test.com", password: "password" })
		.expect(200);

  expect(response.get('Set-Cookie')).toBeDefined();
});
