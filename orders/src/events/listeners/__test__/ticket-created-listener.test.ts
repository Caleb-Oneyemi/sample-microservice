import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { TicketCreatedEvent } from "@cotixdev/common";
import { TicketCreatedListener } from "../ticket-created-listener";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";

const setup = async () => {
	const listener = new TicketCreatedListener(natsWrapper.client);

	const data: TicketCreatedEvent["data"] = {
		version: 0,
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert",
		price: 5000,
		userId: mongoose.Types.ObjectId().toHexString(),
	};

	//@ts-ignore
	const message: Message = {
		ack: jest.fn(),
	};

	return { listener, data, message };
};

it("creates and saves a ticket", async () => {
	const { listener, data, message } = await setup();

	await listener.onMessage(data, message);
	const ticket = await Ticket.findById(data.id);

	expect(ticket).toBeDefined();
	expect(ticket!.title).toBe(data.title);
	expect(ticket!.price).toBe(data.price);
});

it("acknowledges the message", async () => {
	const { listener, data, message } = await setup();

	await listener.onMessage(data, message);
	expect(message.ack).toHaveBeenCalled();
});
