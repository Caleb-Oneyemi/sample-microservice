import request from "supertest";
import { app } from "../../app";

const createTicket = () => {
	return request(app)
		.post("/api/tickets")
		.set("Cookie", (global as any).signin())
		.send({
			title: "Asa Concert",
			price: 10000,
		})
		.expect(201);
};

it("can fetch a list of tickets", async () => {
	await createTicket();
	await createTicket();
	await createTicket();

	const response = await request(app).get("/api/tickets").send({});

	expect(response.statusCode).toBe(200);
	expect(response.body.length).toBe(3);
});
