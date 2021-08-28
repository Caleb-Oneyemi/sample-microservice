import { Subjects, ExpirationCompleteEvent, Publisher } from "@cotixdev/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
	subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
