import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import { User } from "../models/user";
import { BadRequestError, validateRequest } from "@cotixdev/common";

const router = express.Router();

const validationMiddleware = [
	body("email").isEmail().withMessage("Email must be valid"),
	body("password")
		.trim()
		.isLength({ min: 4, max: 20 })
		.withMessage("Password must be between 4 and 20 Characters"),
];

router.post(
	"/api/users/signup",
	validationMiddleware,
	validateRequest,
	async (req: Request, res: Response) => {
		const { email, password } = req.body;
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			throw new BadRequestError("Email in use");
		}

		const newUser = User.build({ email, password });
		await newUser.save();

		const userJwt = jwt.sign(
			{
				id: newUser.id,
				email: newUser.email,
			},
			process.env.JWT_KEY!
		);

		req.session = {
			jwt: userJwt,
		};
		res.status(201).send(newUser);
	}
);

export { router as signupRouter };
