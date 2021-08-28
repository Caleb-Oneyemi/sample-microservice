import request from "supertest";
import { app } from "../../app";
import mongoose from "mongoose";

it("returns a 404 if the ticket does not exist", async () => {
	const id = new mongoose.Types.ObjectId().toHexString();

	const response = await request(app).get(`/api/tickets/${id}`).send({});
	expect(response.statusCode).toBe(404);
});

it("returns a ticket if the ticket is found", async () => {
	const title = "Asa Concert";
	const price = 10000;

	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", (global as any).signin())
		.send({
			title,
			price,
		})
		.expect(201);

	const ticketResponse = await request(app)
		.get(`/api/tickets/${response.body.id}`)
		.send();

	expect(ticketResponse.statusCode).toBe(200);
	expect(ticketResponse.body.title).toBe(title);
	expect(ticketResponse.body.price).toBe(price);
});
