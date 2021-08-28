import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderCreatedEvent, OrderStatus } from "@cotixdev/common";
import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/tickets";

const setup = async () => {
	const listener = new OrderCreatedListener(natsWrapper.client);

	const ticket = Ticket.build({
		title: "movie",
		price: 1500,
		userId: mongoose.Types.ObjectId().toHexString(),
	});
	await ticket.save();

	const data: OrderCreatedEvent["data"] = {
		id: mongoose.Types.ObjectId().toHexString(),
		version: 0,
		status: OrderStatus.Created,
		expiresAt: new Date().toISOString(),
		userId: mongoose.Types.ObjectId().toHexString(),
		ticket: {
			id: ticket.id,
			price: ticket.price,
		},
	};

	// @ts-ignore
	const message: Message = {
		ack: jest.fn(),
	};

	return { listener, ticket, data, message };
};

it("sets the orderId of the ticket to the id emitted by the OrderCreatedEvent", async () => {
	const { listener, ticket, data, message } = await setup();
	await listener.onMessage(data, message);

	const updatedTicket = await Ticket.findById(ticket.id);
	expect(updatedTicket!.orderId).toBe(data.id);
});

it("acknowledges the message", async () => {
	const { listener, data, message } = await setup();
	await listener.onMessage(data, message);

	expect(message.ack).toHaveBeenCalled();
});

it("publishes a ticket updated event", async () => {
	const { listener, data, message } = await setup();
	await listener.onMessage(data, message);

	const details = JSON.parse(
		(natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
	);

	expect(natsWrapper.client.publish).toHaveBeenCalled();
	expect(details.orderId).toEqual(data.id);
});
