import express, { Request, Response } from "express";
import { param } from "express-validator";
import {
	NotFoundError,
	requireAuth,
	validateRequest,
	NotAuthorizedError,
} from "@cotixdev/common";
import { natsWrapper } from "../nats-wrapper";
import { Order, OrderStatus } from "../models/order";
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher";

const router = express.Router();

const validateParams = [
	param("orderId")
		.exists()
		.isMongoId()
		.withMessage("valid order id must be provided"),
];

router.delete(
	"/api/orders/:orderId",
	requireAuth,
	validateParams,
	validateRequest,
	async (req: Request, res: Response) => {
		const { orderId } = req.params;
		const order = await Order.findById(orderId).populate("ticket");

		if (!order) throw new NotFoundError();
		if (order.userId !== req.currentUser!.id) throw new NotAuthorizedError();

		order.status = OrderStatus.Cancelled;
		await order.save();

		new OrderCancelledPublisher(natsWrapper.client).publish({
			id: order.id,
			version: order.version,
			ticket: {
				id: order.ticket.id,
			},
		});
		res.status(204).send(order);
	}
);

export { router as deleteOrderRouter };
