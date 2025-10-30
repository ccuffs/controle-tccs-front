import React from "react";
import { Switch } from "@mui/material";
import { useThemeContext } from "../customs/CustomThemeProvider";

export default function ThemeSwitch() {
	const { toggleTheme } = useThemeContext();
	return <Switch onChange={toggleTheme} color="default" />;
}
