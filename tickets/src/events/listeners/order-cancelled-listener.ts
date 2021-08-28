import { Message } from "node-nats-streaming";
import {
	Listener,
	OrderCancelledEvent,
	Subjects,
	NotFoundError,
} from "@cotixdev/common";
import { queueGroupName } from "./queue-group-name";
import { Ticket } from "../../models/tickets";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
	subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
	queueGroupName = queueGroupName;

	async onMessage(data: OrderCancelledEvent["data"], message: Message) {
		const ticket = await Ticket.findById(data.ticket.id);

		if (!ticket) throw new NotFoundError();
		ticket.set({ orderId: undefined });

		await ticket.save();
		await new TicketUpdatedPublisher(this.client).publish({
			id: ticket.id,
			price: ticket.price,
			title: ticket.title,
			userId: ticket.userId,
			orderId: ticket.orderId,
			version: ticket.version,
		});

		message.ack();
	}
}
