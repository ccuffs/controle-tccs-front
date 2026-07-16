import { useRouteError } from "react-router";

export default function ErrorPage() {
	const error = useRouteError() as { statusText?: string; message?: string };
	console.error(error);

	return (
		<div id="error-page">
			<h1>Oops!</h1>
			<p>Desculpe, um erro inesperado aconteceu.</p>
			<p>
				<i>{error.statusText || error.message}</i>
			</p>
		</div>
	);
}
