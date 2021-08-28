import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
	NotFoundError,
	requireAuth,
	validateRequest,
	NotAuthorizedError,
	BadRequestError,
} from "@cotixdev/common";
import { Ticket } from "../models/tickets";
import { natsWrapper } from "../nats-wrapper";
import { TicketUpdatedPublisher } from "../events/publishers/ticket-updated-publisher";

const router = express.Router();

const validateBody = [
	body("title").not().isEmpty().withMessage("Title is required"),
	body("price").isFloat({ gt: 0 }).withMessage("Price must be valid"),
];

router.put(
	"/api/tickets/:id",
	requireAuth,
	validateBody,
	validateRequest,
	async (req: Request, res: Response) => {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) throw new NotFoundError();
		if (ticket.userId !== req.currentUser!.id) throw new NotAuthorizedError();
		if (ticket.orderId)
			throw new BadRequestError("Cannot edit a reserved ticket");

		ticket.set({
			title: req.body.title,
			price: req.body.price,
		});

		await ticket.save();
		await new TicketUpdatedPublisher(natsWrapper.client).publish({
			id: ticket.id,
			version: ticket.version,
			title: ticket.title,
			price: ticket.price,
			userId: ticket.userId,
		});

		res.status(200).send(ticket);
	}
);

export { router as updateTicketRouter };
