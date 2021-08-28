import express, { Request, Response } from "express";
import { body } from "express-validator";
import { requireAuth, validateRequest } from "@cotixdev/common";
import { natsWrapper } from "../nats-wrapper";
import { Ticket } from "../models/tickets";
import { TicketCreatedPublisher } from "../events/publishers/ticket-created-publisher";

const router = express.Router();

const validateBody = [
	body("title").not().isEmpty().withMessage("Title is required"),
	body("price").isFloat({ gt: 0 }).withMessage("Price must be valid"),
];

router.post(
	"/api/tickets",
	requireAuth,
	validateBody,
	validateRequest,
	async (req: Request, res: Response) => {
		const { title, price } = req.body;

		const ticket = Ticket.build({
			title,
			price,
			userId: req.currentUser!.id,
		});

		await ticket.save();
		await new TicketCreatedPublisher(natsWrapper.client).publish({
			id: ticket.id,
			version: ticket.version,
			title: ticket.title,
			price: ticket.price,
			userId: ticket.userId
		})
		res.status(201).send(ticket);
	}
);

export { router as createTicketRouter };
