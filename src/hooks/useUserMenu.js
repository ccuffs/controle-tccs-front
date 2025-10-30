import { useState, useCallback } from "react";
import { useTheme } from "@mui/material";

export function useUserMenu() {
	const [anchorEl, setAnchorEl] = useState(null);
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === "dark";

	const handleMenu = useCallback((event) => {
		setAnchorEl(event.currentTarget);
	}, []);

	const handleClose = useCallback(() => {
		setAnchorEl(null);
	}, []);

	return {
		anchorEl,
		isDarkMode,
		handleMenu,
		handleClose,
	};
}

