import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import { BadRequestError, validateRequest } from "@cotixdev/common";
import { User } from "../models/user";
import { Password } from "../utils/password";

const router = express.Router();

const validationMiddleware = [
	body("email").isEmail().withMessage("Email must be valid"),
	body("password").trim().notEmpty().withMessage("You must supply a password"),
];

router.post(
	"/api/users/signin",
	validationMiddleware,
	validateRequest,
	async (req: Request, res: Response) => {
		const { email, password } = req.body;
		const existingUser = await User.findOne({ email });
		if (!existingUser) {
			throw new BadRequestError("Invalid credentials");
		}

		const isMatch = await Password.compare(existingUser.password, password);
		if (!isMatch) {
			throw new BadRequestError("Invalid credentials");
		}

		const userJwt = jwt.sign(
			{
				id: existingUser.id,
				email: existingUser.email,
			},
			process.env.JWT_KEY!
		);

		req.session = {
			jwt: userJwt,
		};
		res.status(200).send(existingUser);
	}
);

export { router as signinRouter };
