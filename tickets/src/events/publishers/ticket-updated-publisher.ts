import { Publisher, TicketUpdatedEvent, Subjects } from "@cotixdev/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}