import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderCreatedEvent, OrderStatus } from "@cotixdev/common";
import { OrderCreatedListener } from "../order-created-listener";
import { Order } from "../../../models/order";
import { natsWrapper } from "../../../nats-wrapper";

const setup = async () => {
	const listener = new OrderCreatedListener(natsWrapper.client);

	const data: OrderCreatedEvent["data"] = {
		id: mongoose.Types.ObjectId().toHexString(),
		version: 0,
		expiresAt: new Date().toISOString(),
		userId: mongoose.Types.ObjectId().toHexString(),
		status: OrderStatus.Created,
		ticket: {
			id: mongoose.Types.ObjectId().toHexString(),
			price: 1000,
		},
	};

	//@ts-ignore
	const message: Message = {
		ack: jest.fn(),
	};

	return { listener, data, message };
};

it("replicates the order info", async () => {
	const { listener, data, message } = await setup();

	await listener.onMessage(data, message);
	const order = await Order.findById(data.id);

	expect(order).toBeDefined();
	expect(order!.id).toBe(data.id);
	expect(order!.price).toBe(data.ticket.price);
});

it("acknowledges the message", async () => {
	const { listener, data, message } = await setup();

	await listener.onMessage(data, message);
	expect(message.ack).toHaveBeenCalled();
});
