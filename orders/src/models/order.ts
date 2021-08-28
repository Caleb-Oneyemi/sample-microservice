import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { OrderStatus } from "@cotixdev/common";
import { TicketDocument } from "./ticket";

export { OrderStatus };

interface OrderAttributes {
	userId: string;
	status: OrderStatus;
	expiresAt: Date;
	ticket: TicketDocument;
}

interface OrderDocument extends mongoose.Document {
	userId: string;
	version: number;
	status: OrderStatus;
	expiresAt: Date;
	ticket: TicketDocument;
}

interface OrderModel extends mongoose.Model<OrderDocument> {
	build(attributes: OrderAttributes): OrderDocument;
}

const orderSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			required: true,
			enum: Object.values(OrderStatus),
			default: OrderStatus.Created,
		},
		expiresAt: {
			type: mongoose.Schema.Types.Date,
		},
		ticket: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Ticket",
		},
	},
	{
		toJSON: {
			transform(doc, ret) {
				ret.id = ret._id;
				delete ret._id;
			},
		},
	}
);

orderSchema.set("versionKey", "version");
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (orderAttributes: OrderAttributes) => {
	return new Order(orderAttributes);
};

const Order = mongoose.model<OrderDocument, OrderModel>("Order", orderSchema);

export { Order };
