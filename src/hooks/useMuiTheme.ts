import { useMemo } from "react";
import { createTheme, type Theme } from "@mui/material";
import type { ThemeMode } from "../services/theme-service";

/** Tema MUI do novo design (design/App.tsx). As cores finas ficam nos tokens CSS de index.css. */
export function useMuiTheme(mode: ThemeMode): Theme {
	return useMemo(() => {
		const dark = mode === "dark";
		return createTheme({
			palette: {
				mode,
				primary: { main: "#20707C", light: "#70C8B7", dark: "#185B68", contrastText: "#FFFFFF" },
				secondary: { main: "#FDAE16", contrastText: "#302106" },
				success: { main: "#23845C" },
				warning: { main: "#C27608" },
				error: { main: "#B9363F" },
				info: { main: "#3478B8" },
				background: { default: dark ? "#101617" : "#F5F4F6", paper: dark ? "#182123" : "#FFFFFF" },
				text: { primary: dark ? "#F4F5F4" : "#1D1B1B", secondary: dark ? "#AEB7B7" : "#686565" },
				divider: dark ? "#2D3A3C" : "#E5E1E2",
			},
			shape: { borderRadius: 8 },
			typography: {
				fontFamily: "'Inter Variable', Inter, system-ui, sans-serif",
				button: { textTransform: "none", fontWeight: 600, fontSize: "0.8125rem" },
			},
			components: {
				MuiButton: {
					defaultProps: { disableRipple: false },
					styleOverrides: { root: { minHeight: 40, borderRadius: 8, boxShadow: "none" } },
				},
				MuiChip: {
					styleOverrides: { root: { borderRadius: 999, fontWeight: 700 }, label: { paddingLeft: 8, paddingRight: 8 } },
				},
				MuiDialog: { styleOverrides: { paper: { borderRadius: 14 } } },
				MuiDrawer: { styleOverrides: { paper: { backgroundImage: "none" } } },
			},
		});
	}, [mode]);
}
