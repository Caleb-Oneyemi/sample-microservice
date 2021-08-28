import { Message } from "node-nats-streaming";
import {
	Subjects,
	ExpirationCompleteEvent,
	Listener,
	NotFoundError,
	OrderStatus,
} from "@cotixdev/common";
import { Order } from "../../models/order";
import { queueGroupName } from "./queue-group-name";
import { OrderCancelledPublisher } from "../publishers/order-cancelled-publisher";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
	subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
	queueGroupName = queueGroupName;

	async onMessage(data: ExpirationCompleteEvent["data"], message: Message) {
		const order = await Order.findById(data.orderId).populate("ticket");

		if (!order) throw new NotFoundError();
		if (order.status === OrderStatus.Complete) return message.ack();

		order.set({
			status: OrderStatus.Cancelled,
		});
		await order.save();
		await new OrderCancelledPublisher(this.client).publish({
			id: order.id,
			version: order.version,
			ticket: {
				id: order.ticket.id,
			},
		});

		message.ack();
	}
}
