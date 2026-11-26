import { createContext, useContext, useEffect, type ReactNode } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useTheme as useCustomTheme } from "../../hooks/useTheme";
import { useMuiTheme } from "../../hooks/useMuiTheme";
import type { ThemeMode } from "../../services/theme-service";

interface ThemeContextValue {
	mode: ThemeMode;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	mode: "light",
	toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export default function CustomThemeProvider({ children }: { children: ReactNode }) {
	const { mode, toggleTheme } = useCustomTheme();
	const theme = useMuiTheme(mode);

	// Os tokens escuros de index.css dependem da classe `.dark`; ela fica no <html>
	// para valer também nos portais do MUI (Drawer, Dialog, Menu).
	useEffect(() => {
		document.documentElement.classList.toggle("dark", mode === "dark");
	}, [mode]);

	return (
		<ThemeContext.Provider value={{ mode, toggleTheme }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</ThemeContext.Provider>
	);
}
