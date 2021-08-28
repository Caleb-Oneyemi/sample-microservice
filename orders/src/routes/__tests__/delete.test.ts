import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app";
import { Ticket } from "../../models/ticket";
import { Order, OrderStatus } from "../../models/order";
import { natsWrapper } from "../../nats-wrapper";

const orderId = mongoose.Types.ObjectId();

it("cannot delete an order if the user is not signed in", async () => {
	const response = await request(app).delete(`/api/orders/${orderId}`).send({});

	expect(response.statusCode).toBe(401);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({ errors: [{ message: "Not Authorized" }] });
});

it("throws an error for invalid orderId params", async () => {
	const response = await request(app)
		.delete("/api/orders/1")
		.set("Cookie", (global as any).signin())
		.send({});

	expect(response.statusCode).toBe(400);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({
		errors: [{ message: "valid order id must be provided", field: "orderId" }],
	});
});

it("deletes an order", async () => {
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

	await request(app)
		.delete(`/api/orders/${order.id}`)
		.set("Cookie", user)
		.send()
		.expect(204);

	const updatedOrder = await Order.findById(order.id);
	expect(updatedOrder?.status).toBe(OrderStatus.Cancelled);
});

it("returns an error if one user tries to delete another users order", async () => {
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
		.delete(`/api/orders/${order.id}`)
		.set("Cookie", (global as any).signin())
		.send();

	expect(response.statusCode).toBe(401);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({
		errors: [{ message: "Not Authorized" }],
	});
});

it("emits an order cancelled event", async () => {
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

	await request(app)
		.delete(`/api/orders/${order.id}`)
		.set("Cookie", user)
		.send()
		.expect(204);

	expect(natsWrapper.client.publish).toHaveBeenCalled();
});
