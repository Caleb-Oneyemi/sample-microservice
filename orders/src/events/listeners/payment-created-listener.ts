import { Message } from "node-nats-streaming";
import {
	Subjects,
	Listener,
	PaymentCreatedEvent,
	NotFoundError,
	OrderStatus,
} from "@cotixdev/common";
import { queueGroupName } from "./queue-group-name";
import { Order } from "../../models/order";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
	subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
	queueGroupName = queueGroupName;

	async onMessage(data: PaymentCreatedEvent["data"], message: Message) {
		const order = await Order.findById(data.orderId);

		if (!order) throw new NotFoundError();

		order.set({
			status: OrderStatus.Complete,
		});
		await order.save();
		message.ack();
	}
}
