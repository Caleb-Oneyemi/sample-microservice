import { testId } from "../test/testId";

export const stripe = {
	charges: {
		create: jest.fn().mockResolvedValue({ id: testId }),
	},
};
