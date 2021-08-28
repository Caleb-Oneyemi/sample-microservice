import { Message } from "node-nats-streaming";
import { Listener, OrderCreatedEvent, Subjects } from "@cotixdev/common";
import { queueGroupName } from "./queue-group-name";
import { expirationQueue } from "../../queues/expiration-queue";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
	subject: Subjects.OrderCreated = Subjects.OrderCreated;
	queueGroupName = queueGroupName;

	async onMessage(data: OrderCreatedEvent["data"], message: Message) {
		const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
    console.log(`waiting ${delay} miliseconds`)

		await expirationQueue.add(
			{
				orderId: data.id,
			},
			{ delay: 60000 }
		);

		message.ack();
	}
}
