import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import "@fontsource-variable/inter";
import "material-symbols/rounded.css";
import "./index.css";

ReactDOM.hydrateRoot(
	document,
	<React.StrictMode>
		<HydratedRouter />
	</React.StrictMode>,
);
