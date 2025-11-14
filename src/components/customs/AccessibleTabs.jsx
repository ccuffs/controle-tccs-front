import React from "react";
import { Box } from "@mui/material";

export function AccessibleTabPanel({
	children,
	value,
	index,
	idPrefix,
	...other
}) {
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`${idPrefix}-tabpanel-${index}`}
			aria-labelledby={`${idPrefix}-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

export function getA11yProps(idPrefix, index) {
	return {
		id: `${idPrefix}-tab-${index}`,
		"aria-controls": `${idPrefix}-tabpanel-${index}`,
	};
}
