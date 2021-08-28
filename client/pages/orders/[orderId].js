import { useEffect, useState } from "react";
import Router from "next/router";
import StripeCheckout from "react-stripe-checkout";
import useRequest from "../../hooks/use-request";

const showOrder = ({ order, currentUser }) => {
	const [timeLeft, setTimeLeft] = useState(0);
	const { makeRequest, errors } = useRequest({
		url: "/api/payments",
		method: "post",
		body: {
			orderId: order.id,
		},
		onSuccess: () => Router.push("/orders"),
	});

	useEffect(() => {
		const findTimeLeft = () => {
			const msLeft = new Date(order.expiresAt) - new Date();
			setTimeLeft(Math.round(msLeft / 1000));
		};

		findTimeLeft();
		const timerId = setInterval(findTimeLeft, 1000);
		return () => {
			clearTimeout(timerId);
		};
	}, [order]);

	if (timeLeft < 0) {
		return <div>Order Expired</div>;
	}

	return (
		<div>
			Time left to pay: {timeLeft} seconds
			<StripeCheckout
				token={({ id }) => makeRequest({ token: id })}
				stripeKey="pk_test_51JT1FVJBzeeQuR9URTDMHrJQfWTTmYID66tAlGeyOkBF9dx3ohojCUEIBraEqMDpWuvumXAXqwoJJ9cU2lCjW3fZ00mWw50lXP"
				amount={order.ticket.price * 100}
				email={currentUser.email}
			/>
			{errors}
		</div>
	);
};

showOrder.getInitialProps = async (context, client) => {
	const { orderId } = context.query;
	const { data } = await client.get(`/api/orders/${orderId}`);

	return { order: data };
};

export default showOrder;
