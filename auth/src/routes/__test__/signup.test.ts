import request from "supertest";
import { app } from "../../app";

it("returns a 201 status on successful signup", async () => {
	return request(app)
		.post("/api/users/signup")
		.send({ email: "test@test.com", password: "password" })
		.expect(201);
});

it("returns a 400 status for an invalid email", async () => {
	return request(app)
		.post("/api/users/signup")
		.send({ email: "test", password: "password" })
		.expect(400);
});

it("returns a 400 status for an invalid password", async () => {
	return request(app)
		.post("/api/users/signup")
		.send({ email: "test@test.com", password: "p" })
		.expect(400);
});

it("returns a 400 status with missing email and password", async () => {
	return request(app).post("/api/users/signup").send({}).expect(400);
});

it("it disallows duplicate emails", async () => {
	await request(app)
		.post("/api/users/signup")
		.send({ email: "test@test.com", password: "password" })
		.expect(201);

	await request(app)
		.post("/api/users/signup")
		.send({ email: "test@test.com", password: "password" })
		.expect(400);
});

it("it sets a cookie after successful startup", async () => {
	const response = await request(app)
		.post("/api/users/signup")
		.send({ email: "test@test.com", password: "password" })
		.expect(201);

  expect(response.get('Set-Cookie')).toBeDefined();
});
