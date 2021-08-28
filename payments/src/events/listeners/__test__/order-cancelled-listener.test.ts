import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderCancelledEvent, OrderStatus } from "@cotixdev/common";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { Order } from "../../../models/order";
import { natsWrapper } from "../../../nats-wrapper";

const setup = async () => {
	const listener = new OrderCancelledListener(natsWrapper.client);

	const order = Order.build({
		id: mongoose.Types.ObjectId().toHexString(),
		version: 0,
		userId: mongoose.Types.ObjectId().toHexString(),
		status: OrderStatus.Created,
		price: 1000,
	});
	await order.save();

	const data: OrderCancelledEvent["data"] = {
		id: order.id,
		version: 1,
		ticket: {
			id: mongoose.Types.ObjectId().toHexString(),
		},
	};

	//@ts-ignore
	const message: Message = {
		ack: jest.fn(),
	};

	return { order, listener, data, message };
};

it("updates the status of the order", async () => {
	const { order, listener, data, message } = await setup();

	await listener.onMessage(data, message);
	const updatedOrder = await Order.findById(order.id);

	expect(updatedOrder).toBeDefined();
	expect(updatedOrder!.status).toBe(OrderStatus.Cancelled);
});

it("acknowledges the message", async () => {
	const { listener, data, message } = await setup();

	await listener.onMessage(data, message);
	expect(message.ack).toHaveBeenCalled();
});
