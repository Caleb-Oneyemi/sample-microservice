import request from "supertest";
import { app } from "../../app";
import mongoose from "mongoose";
import { Ticket } from "../../models/tickets";
import { natsWrapper } from "../../nats-wrapper";

it("returns a 404 if the provided id does not exist", async () => {
	const id = new mongoose.Types.ObjectId().toHexString();
	await request(app)
		.put(`/api/tickets/${id}`)
		.set("Cookie", (global as any).signin())
		.send({
			title: "Asa Concert",
			price: 10000,
		})
		.expect(404);
});

it("returns a 401 if the user is not authenticated", async () => {
	const id = new mongoose.Types.ObjectId().toHexString();
	await request(app)
		.put(`/api/tickets/${id}`)
		.send({
			title: "Asa Concert",
			price: 10000,
		})
		.expect(401);
});

it("returns a 401 if the user does not own the ticket", async () => {
	const response = await request(app)
		.post(`/api/tickets`)
		.set("Cookie", (global as any).signin())
		.send({
			title: "Asa Concert",
			price: 10000,
		})
		.expect(201);

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", (global as any).signin())
		.send({
			title: "Asa Concert Unrivaled",
			price: 25000,
		})
		.expect(401);

	const originalTicket = await Ticket.findById(response.body.id);
	expect(originalTicket?.title).toBe("Asa Concert");
	expect(originalTicket?.price).toBe(10000);
});

it("it returns 400 if the user provides an invalid title or price", async () => {
	const cookie = (global as any).signin();
	const response = await request(app)
		.post(`/api/tickets`)
		.set("Cookie", cookie)
		.send({
			title: "Asa Concert",
			price: 10000,
		})
		.expect(201);

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({
			title: "",
			price: -10000,
		})
		.expect(400);
});

it("updates the ticket when provided valid inputs", async () => {
	const cookie = (global as any).signin();
	const response = await request(app)
		.post(`/api/tickets`)
		.set("Cookie", cookie)
		.send({
			title: "Asa Concert",
			price: 10000,
		})
		.expect(201);

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({
			title: "Asa Concert Unrivaled",
			price: 25000,
		})
		.expect(200);

	const updatedTicket = await Ticket.findById(response.body.id);
	expect(updatedTicket?.title).toBe("Asa Concert Unrivaled");
	expect(updatedTicket?.price).toBe(25000);
});

it("publishes an event", async () => {
	const cookie = (global as any).signin();
	const response = await request(app)
		.post(`/api/tickets`)
		.set("Cookie", cookie)
		.send({
			title: "Asa Concert",
			price: 10000,
		})
		.expect(201);

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({
			title: "Asa Concert Unrivaled",
			price: 25000,
		})
		.expect(200);

	expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it("rejects updates if the ticket is reserved", async () => {
	const cookie = (global as any).signin();
	const response = await request(app)
		.post(`/api/tickets`)
		.set("Cookie", cookie)
		.send({
			title: "Asa Concert",
			price: 10000,
		})
		.expect(201);

	const ticket = await Ticket.findById(response.body.id);
	ticket?.set({ orderId: mongoose.Types.ObjectId().toHexString() });
	await ticket?.save();

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({
			title: "Asa Concert Unrivaled",
			price: 25000,
		})
		.expect(400);
});
