import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { TicketUpdatedEvent } from "@cotixdev/common";
import { TicketUpdatedListener } from "../ticket-updated-listener";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";

const setup = async (input: { useValidId: boolean }) => {
	const listener = new TicketUpdatedListener(natsWrapper.client);
	const invalidId = mongoose.Types.ObjectId().toHexString();

	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert",
		price: 5000,
	});
	await ticket.save();

	const data: TicketUpdatedEvent["data"] = {
		version: ticket.version + 1,
		id: input.useValidId ? ticket.id : invalidId,
		title: "new concert",
		price: 10000,
		userId: mongoose.Types.ObjectId().toHexString(),
	};

	//@ts-ignore
	const message: Message = {
		ack: jest.fn(),
	};
	return { ticket, listener, data, message };
};

it("finds, updates and saves a ticket", async () => {
	const { ticket, listener, data, message } = await setup({ useValidId: true });

	await listener.onMessage(data, message);
	const updatedTicket = await Ticket.findById(ticket.id);

	expect(updatedTicket!.title).toBe(data.title);
	expect(updatedTicket!.price).toBe(data.price);
	expect(updatedTicket!.version).toBe(data.version);
});

it("does not find, update and save a ticket", async () => {
	const { ticket, listener, data, message } = await setup({
		useValidId: false,
	});

	try {
		await listener.onMessage(data, message);
	} catch (err) {
		expect(err.message).toBe("Route not found");
	}

	const updatedTicket = await Ticket.findById(ticket.id);

	expect(updatedTicket!.title).not.toBe(data.title);
	expect(updatedTicket!.price).not.toBe(data.price);
	expect(updatedTicket!.version).not.toBe(data.version);
});

it("acknowledges the message when the id is valid and events are in order", async () => {
	const { listener, data, message } = await setup({ useValidId: true });

	await listener.onMessage(data, message);
	expect(message.ack).toHaveBeenCalled();
});

it("does not acknowledge the message when given an invalid id", async () => {
	const { listener, data, message } = await setup({ useValidId: false });

	try {
		await listener.onMessage(data, message);
	} catch (err) {
		expect(err.message).toBe("Route not found");
	}

	expect(message.ack).not.toHaveBeenCalled();
});

it("does not acknowledge the message for out of order events", async () => {
	const { listener, data, message } = await setup({ useValidId: true });
	data.version = 10;

	try {
		await listener.onMessage(data, message);
	} catch (err) {
		expect(err.message).toBe("Route not found");
	}

	expect(message.ack).not.toHaveBeenCalled();
});
