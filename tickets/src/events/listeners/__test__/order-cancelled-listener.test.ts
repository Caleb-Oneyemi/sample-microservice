import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderCancelledEvent, OrderStatus } from "@cotixdev/common";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/tickets";

const setup = async () => {
	const listener = new OrderCancelledListener(natsWrapper.client);

	const orderId = mongoose.Types.ObjectId().toHexString();
	const ticket = Ticket.build({
		title: "movie",
		price: 1500,
		userId: mongoose.Types.ObjectId().toHexString(),
	});
	ticket.set({ orderId });
	await ticket.save();

	const data: OrderCancelledEvent["data"] = {
		id: mongoose.Types.ObjectId().toHexString(),
		version: 0,
		ticket: {
			id: ticket.id,
		},
	};

	// @ts-ignore
	const message: Message = {
		ack: jest.fn(),
	};

	return { orderId, listener, ticket, data, message };
};

it("sets the orderId of the ticket to be undefined", async () => {
	const { listener, ticket, data, message } = await setup();
	await listener.onMessage(data, message);

	const updatedTicket = await Ticket.findById(ticket.id);
	expect(updatedTicket!.orderId).toBeUndefined();
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
	expect(details.id).toEqual(data.ticket.id);
});
