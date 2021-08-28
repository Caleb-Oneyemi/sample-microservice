import { Ticket } from "../tickets";

it("implements optimistic concurrency control", async () => {
	const ticket = Ticket.build({
		title: "concert",
		price: 1000,
		userId: "123",
	});

	await ticket.save();

	const firstInstance = await Ticket.findById(ticket.id);
	const secondInstance = await Ticket.findById(ticket.id);

	firstInstance!.set({ price: 5000 });
	secondInstance!.set({ price: 8000 });

	await firstInstance!.save();

	try {
		await secondInstance!.save();
	} catch (err) {
		return;
	}

	throw new Error("never runs");
});

it("increments the version number on multiple saves", async () => {
	const ticket = Ticket.build({
		title: "concert",
		price: 1000,
		userId: "123",
	});

  await ticket.save();
  expect(ticket.version).toBe(0)
  await ticket.save();
  expect(ticket.version).toBe(1)
  await ticket.save();
  expect(ticket.version).toBe(2)
});
