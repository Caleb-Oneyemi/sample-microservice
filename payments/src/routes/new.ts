import express, { Request, Response, NextFunction, Router } from "express";
import { body } from "express-validator";
import { stripe } from "../stripe";
import {
	requireAuth,
	validateRequest,
	BadRequestError,
	NotFoundError,
	NotAuthorizedError,
	OrderStatus,
} from "@cotixdev/common";
import { Order } from "../models/order";
import { Payment } from "../models/payment";
import { natsWrapper } from "../nats-wrapper";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";

const router = express.Router();

const validateBody = [
	body("token").not().isEmpty(),
	body("orderId").not().isEmpty().isMongoId(),
];

router.post(
	"/api/payments",
	requireAuth,
	validateBody,
	validateRequest,
	async (req: Request, res: Response) => {
		const { token, orderId } = req.body;
		const order = await Order.findById(orderId);

		if (!order) throw new NotFoundError();
		if (order.userId !== req.currentUser!.id) throw new NotAuthorizedError();
		if (order.status === OrderStatus.Cancelled) {
			throw new BadRequestError("Cannot pay for a cancelled order");
		}

		const charge = await stripe.charges.create({
			currency: "usd",
			amount: order.price * 100,
			source: token,
		});

		const payment = Payment.build({
			orderId,
			stripeId: charge.id,
		});
		await payment.save();

		new PaymentCreatedPublisher(natsWrapper.client).publish({
			id: payment.id,
			orderId: payment.orderId,
			stripeId: payment.stripeId,
		});

		res.status(201).send({ id: payment.id });
	}
);

export { router as createChargeRouter };
