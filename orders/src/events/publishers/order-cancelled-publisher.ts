import { Publisher, OrderCancelledEvent, Subjects } from "@cotixdev/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
	subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
