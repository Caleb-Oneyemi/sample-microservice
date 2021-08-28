import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { param } from "express-validator";
import {
	NotFoundError,
	requireAuth,
	validateRequest,
	NotAuthorizedError,
} from "@cotixdev/common";
import { Order } from "../models/order";

const router = express.Router();

const validateParams = [
	param("orderId")
		.exists()
		.isMongoId()
		.withMessage("valid order id must be provided"),
];

router.get(
	"/api/orders/:orderId",
	requireAuth,
	validateParams,
	validateRequest,
	async (req: Request, res: Response) => {
		const order = await Order.findById(req.params.orderId).populate("ticket");
		if (!order) throw new NotFoundError();
		if (order.userId !== req.currentUser!.id) throw new NotAuthorizedError();

		res.status(200).send(order);
	}
);

export { router as showOrderRouter };
