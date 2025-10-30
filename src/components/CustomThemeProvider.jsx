import React, { createContext, useContext } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useTheme as useCustomTheme } from "../hooks/useTheme.js";
import { useMuiTheme } from "../hooks/useMuiTheme.js";

/**
 * CustomThemeProvider - Componente responsável apenas pela definição da tela (UI)
 * A lógica de negócio e chamadas de API estão no hook useTheme
 */
const ThemeContext = createContext({
	toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

// Cores customizadas
export const customColors = {
	darkGray: "#454646",
	orange: "#fdae16",
	teal: "#20707c",
	gunmetal: "333a3f",
	tiffanyBlue: "#70C8B7",
	outerSpace: "#4B5555",
	goldenBrown: "#886727",
	whiteSmoke: "#f5f4f6",
	glaucous: "#5984c3",
	platinum: "#e4e4e5",
	jet: "#373535",
	frenchGray: "#b5b6be",
	veronica: "#a147d8",
	eerieBlack: "#1d1b1b",
	trueBlue: "#3365b3",
	raisinBlack: "#272829",
	taupe: "#4a4342",
};

export default function CustomThemeProvider({ children }) {
	// Usar o hook customizado para gerenciar o tema
	const { mode, toggleTheme } = useCustomTheme();

	// Memorizando o tema para evitar re-renderizações desnecessárias
	const theme = useMuiTheme(mode, customColors);

	return (
		<ThemeContext.Provider value={{ toggleTheme }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</ThemeContext.Provider>
	);
}
