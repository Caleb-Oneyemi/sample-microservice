import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app";
import { Order, OrderStatus } from "../../models/order";
import { Ticket } from "../../models/ticket";
import { natsWrapper } from "../../nats-wrapper";

it("has a route handler listening to /api/orders for post requests", async () => {
	const response = await request(app).post("/api/orders").send({});

	expect(response.statusCode).not.toBe(404);
});

it("cannot be accessed if the user is not signed in", async () => {
	const response = await request(app).post("/api/orders").send({});

	expect(response.statusCode).toBe(401);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({ errors: [{ message: "Not Authorized" }] });
});

it("returns an error for invalid inputs", async () => {
	let response = await request(app)
		.post("/api/orders")
		.set("Cookie", (global as any).signin())
		.send({
			ticketId: "",
		});

	expect(response.statusCode).toBe(400);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({
		errors: [
			{ message: "Invalid value", field: "ticketId" },
			{ message: "Ticket must be provided", field: "ticketId" },
		],
	});
});

it("returns an error if the ticket does not exist", async () => {
	const ticketId = mongoose.Types.ObjectId();

	let response = await request(app)
		.post("/api/orders")
		.set("Cookie", (global as any).signin())
		.send({ ticketId });

	expect(response.statusCode).toBe(404);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({ errors: [{ message: "Not Found" }] });
});

it("returns an error if the ticket is already reserved", async () => {
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "Asa concert",
		price: 20,
	});
	await ticket.save();

	const order = Order.build({
		ticket,
		userId: "123",
		status: OrderStatus.Created,
		expiresAt: new Date(),
	});
	await order.save();

	let response = await request(app)
		.post("/api/orders")
		.set("Cookie", (global as any).signin())
		.send({
			ticketId: ticket.id,
		});

	expect(response.statusCode).toBe(400);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({
		errors: [{ message: "Ticket is already reserved" }],
	});
});

it("reserves a ticket", async () => {
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "Asa concert",
		price: 20,
	});
	await ticket.save();

	let response = await request(app)
		.post("/api/orders")
		.set("Cookie", (global as any).signin())
		.send({
			ticketId: ticket.id,
		});

	let order = await Order.findById(response.body.id);

	expect(response.statusCode).toBe(201);
	expect(response.body).toHaveProperty("ticket");
	expect(response.body.ticket.id).toBe(ticket.id);
	expect(order).not.toBe(null);
	expect(order!.id).toBe(response.body.id);
});

it("emits an order created event", async () => {
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "Asa concert",
		price: 20,
	});
	await ticket.save();

	await request(app)
		.post("/api/orders")
		.set("Cookie", (global as any).signin())
		.send({
			ticketId: ticket.id,
		})
		.expect(201);

	expect(natsWrapper.client.publish).toHaveBeenCalled();
});
