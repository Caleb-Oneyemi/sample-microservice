import Router from "next/router";
import { useEffect } from "react";
import useRequest from "../../hooks/use-request";

const signout = () => {
	const { makeRequest } = useRequest({
		url: "/api/users/signout",
		method: "post",
		body: {},
		onSuccess: () => Router.push("/"),
	});

	useEffect(() => {
		makeRequest();
	}, []);

	return <div>sigining out...</div>;
};

export default signout