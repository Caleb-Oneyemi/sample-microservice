import mongoose from "mongoose";
import { OrderStatus } from "@cotixdev/common";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface OrderAttributes {
	id: string;
	version: number;
	userId: string;
	price: number;
	status: OrderStatus;
}

interface OrderDocument extends mongoose.Document {
	version: number;
	userId: string;
	price: number;
	status: OrderStatus;
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
		price: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			required: true,
			enum: Object.values(OrderStatus),
			default: OrderStatus.Created,
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

orderSchema.statics.build = (attributes: OrderAttributes) => {
	return new Order({
		_id: attributes.id,
		userId: attributes.userId,
		version: attributes.version,
		price: attributes.price,
		status: attributes.status,
	});
};

const Order = mongoose.model<OrderDocument, OrderModel>("Order", orderSchema);

export { Order };
