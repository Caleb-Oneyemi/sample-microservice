import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderStatus, ExpirationCompleteEvent } from "@cotixdev/common";
import { natsWrapper } from "../../../nats-wrapper";
import { Order } from "../../../models/order";
import { Ticket } from "../../../models/ticket";
import { ExpirationCompleteListener } from "../expiration-complete-listener";

const setup = async () => {
	const listener = new ExpirationCompleteListener(natsWrapper.client);

	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert",
		price: 20,
	});
	await ticket.save();

	const order = Order.build({
		status: OrderStatus.Created,
		userId: mongoose.Types.ObjectId().toHexString(),
		expiresAt: new Date(),
		ticket,
	});
	await order.save();

	const data: ExpirationCompleteEvent["data"] = {
		orderId: order.id,
	};

	// @ts-ignore
	const message: Message = {
		ack: jest.fn(),
	};

	return { listener, order, data, message };
};

it("updates the order status to cancelled", async () => {
	const { listener, order, data, message } = await setup();
	await listener.onMessage(data, message);

	const updatedOrder = await Order.findById(order.id);
	expect(updatedOrder!.status).toBe(OrderStatus.Cancelled);
});

it("emits an OrderCancelled Event", async () => {
	const { listener, order, data, message } = await setup();
	await listener.onMessage(data, message);

	expect(natsWrapper.client.publish).toHaveBeenCalled();

	const eventData = JSON.parse(
		(natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
	);
	expect(eventData.id).toEqual(order.id);
});

it("acknowledges the message", async () => {
	const { listener, data, message } = await setup();
	await listener.onMessage(data, message);

  expect(message.ack).toHaveBeenCalled()
});
