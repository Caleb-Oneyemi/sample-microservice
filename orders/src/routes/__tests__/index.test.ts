import request from "supertest";
import mongoose from 'mongoose';
import { app } from "../../app";
import { Ticket } from "../../models/ticket";

const buildTicket = async (n: number) => {
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert" + n,
		price: 20,
	});

	await ticket.save();
	return ticket;
};

it("cannot fetch all orders if the user is not signed in", async () => {
	const response = await request(app).get("/api/orders").send({});

	expect(response.statusCode).toBe(401);
	expect(response.body).toHaveProperty("errors");
	expect(response.body).toEqual({ errors: [{ message: "Not Authorized" }] });
});

it("fetches orders for a particular user", async () => {
	const ticketOne = await buildTicket(1);
	const ticketTwo = await buildTicket(2);
	const ticketThree = await buildTicket(3);

	const userOne = (global as any).signin();
	const userTwo = (global as any).signin();

	await request(app)
		.post("/api/orders")
		.set("Cookie", userOne)
		.send({ ticketId: ticketOne.id })
		.expect(201);

	const { body: orderOne } = await request(app)
		.post("/api/orders")
		.set("Cookie", userTwo)
		.send({ ticketId: ticketTwo.id })
		.expect(201);

	const { body: orderTwo } = await request(app)
		.post("/api/orders")
		.set("Cookie", userTwo)
		.send({ ticketId: ticketThree.id })
		.expect(201);

	const response = await request(app).get("/api/orders").set("Cookie", userTwo);
	expect(response.statusCode).toBe(200);
	expect(response.body.length).toBe(2);
	expect(response.body[0].id).toBe(orderOne.id);
	expect(response.body[1].id).toBe(orderTwo.id);
	expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
	expect(response.body[1].ticket.id).toEqual(ticketThree.id);
});
