import { Message } from "node-nats-streaming";
import { Subjects, TicketCreatedEvent, Listener } from "@cotixdev/common";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
	subject: Subjects.TicketCreated = Subjects.TicketCreated;
	queueGroupName = queueGroupName;

	async onMessage(data: TicketCreatedEvent["data"], message: Message) {
		const { id, title, price } = data;

		const ticket = Ticket.build({
			id,
			title,
			price,
		});

		await ticket.save();
		message.ack();
	}
}
