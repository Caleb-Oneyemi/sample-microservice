import { Message } from "node-nats-streaming";
import {
	Subjects,
	TicketUpdatedEvent,
	Listener,
	NotFoundError,
} from "@cotixdev/common";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
	subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
	queueGroupName = queueGroupName;

	async onMessage(data: TicketUpdatedEvent["data"], message: Message) {
		const { title, price } = data;

		const ticket = await Ticket.findByEvent(data);
		if (!ticket) throw new NotFoundError();

		ticket.set({ title, price });
		await ticket.save();
		message.ack();
	}
}
