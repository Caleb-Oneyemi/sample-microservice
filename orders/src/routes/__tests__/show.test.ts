import request from "supertest";
import { app } from "../../app";
import { Ticket } from "../../models/ticket";
import mongoose from "mongoose";

const orderId = mongoose.Types.ObjectId();

it("cannot fetch an order if the user is not signed in", async () => {
	const response = await request(app).get(`/api/orders/${orderId}`).send({});

	expect(response.statusCode).toBe(401);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({ errors: [{ message: "Not Authorized" }] });
});

it("throws an error for invalid orderId params", async () => {
	const response = await request(app)
		.get("/api/orders/1")
		.set("Cookie", (global as any).signin())
		.send({});

	expect(response.statusCode).toBe(400);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({
		errors: [{ message: "valid order id must be provided", field: "orderId" }],
	});
});

it("fetches the order if the user is signed in", async () => {
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert",
		price: 20,
	});

	await ticket.save();
	const user = (global as any).signin();

	const { body: order } = await request(app)
		.post("/api/orders")
		.set("Cookie", user)
		.send({ ticketId: ticket.id })
		.expect(201);

	const { body: fetchedOrder } = await request(app)
		.get(`/api/orders/${order.id}`)
		.set("Cookie", user)
		.send()
		.expect(200);

	expect(fetchedOrder.id).toBe(order.id);
	expect(fetchedOrder.ticket.id).toBe(ticket.id);
});

it("returns an error if one user tries to fetch another users order", async () => {
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert",
		price: 20,
	});

	await ticket.save();
	const user = (global as any).signin();

	const { body: order } = await request(app)
		.post("/api/orders")
		.set("Cookie", user)
		.send({ ticketId: ticket.id })
		.expect(201);

	const response = await request(app)
		.get(`/api/orders/${order.id}`)
		.set("Cookie", (global as any).signin())
		.send();

	expect(response.statusCode).toBe(401);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({
		errors: [{ message: "Not Authorized" }],
	});
});
