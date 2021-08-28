import { Publisher, TicketCreatedEvent, Subjects } from "@cotixdev/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
}