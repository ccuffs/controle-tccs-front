import type { ReactNode, HTMLAttributes } from "react";
import { Box } from "@mui/material";

interface AccessibleTabPanelProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
	value: number;
	index: number;
	idPrefix: string;
}

export function AccessibleTabPanel({
	children,
	value,
	index,
	idPrefix,
	...other
}: AccessibleTabPanelProps) {
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

export function getA11yProps(idPrefix: string, index: number) {
	return {
		id: `${idPrefix}-tab-${index}`,
		"aria-controls": `${idPrefix}-tabpanel-${index}`,
	};
}
