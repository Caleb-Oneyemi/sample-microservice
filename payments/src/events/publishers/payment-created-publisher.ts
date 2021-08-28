import { Subjects, PaymentCreatedEvent, Publisher } from "@cotixdev/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
	subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
