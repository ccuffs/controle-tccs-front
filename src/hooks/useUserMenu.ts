import { useState, useCallback, type MouseEvent } from "react";
import { useTheme } from "@mui/material";

export function useUserMenu({ logout }: { logout: () => void }) {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === "dark";

	const handleMenu = useCallback((event: MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	}, []);

	const handleClose = useCallback(() => {
		setAnchorEl(null);
	}, []);

	const handleLogout = useCallback(() => {
		handleClose();
		logout();
	}, [handleClose, logout]);

	return {
		anchorEl,
		isDarkMode,
		handleMenu,
		handleClose,
		handleLogout,
	};
}
