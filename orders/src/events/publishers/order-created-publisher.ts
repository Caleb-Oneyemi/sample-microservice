import { Publisher, OrderCreatedEvent, Subjects } from "@cotixdev/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
	subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
