import request from "supertest";
import { app } from "../../app";
import { Ticket } from "../../models/tickets";
import { natsWrapper } from "../../nats-wrapper";

it("has a route handler listening to /api/tickets for post requests", async () => {
	const response = await request(app).post("/api/tickets").send({});

	expect(response.statusCode).not.toBe(404);
});

it("cannot be accessed if the user is not signed in", async () => {
	const response = await request(app).post("/api/tickets").send({});

	expect(response.statusCode).toBe(401);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({ errors: [{ message: "Not Authorized" }] });
});

it("returns an error if an invalid title is provided", async () => {
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", (global as any).signin())
		.send({
			title: "",
			price: 10,
		});

	expect(response.statusCode).toBe(400);
});

it("returns an error if an invalid price is provided", async () => {
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", (global as any).signin())
		.send({
			title: "test",
			price: -10,
		});

	expect(response.statusCode).toBe(400);
});

it("creates a ticket for valid input", async () => {
	let tickets = await Ticket.find({});
	expect(tickets.length).toBe(0);

	const title = "Asa concert";
	const price = 10000;
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", (global as any).signin())
		.send({
			title,
			price,
		});

	tickets = await Ticket.find({});

	expect(response.statusCode).toBe(201);
	expect(tickets.length).toBe(1);
	expect(tickets[0].title).toBe(title);
	expect(tickets[0].price).toBe(price);
});

it("publishes an event", async () => {
	const title = "Asa concert";
	const price = 10000;
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", (global as any).signin())
		.send({
			title,
			price,
		})
		.expect(201);

	expect(natsWrapper.client.publish).toHaveBeenCalled()
});
