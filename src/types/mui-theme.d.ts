import "@mui/material/styles";

/**
 * Cores customizadas adicionais definidas em `useMuiTheme`, acessíveis via
 * `theme.palette.custom`.
 */
interface CustomPaletteColors {
	veronica: string;
	glaucous: string;
	trueBlue: string;
	frenchGray: string;
	raisinBlack: string;
	taupe: string;
}

declare module "@mui/material/styles" {
	interface Palette {
		custom: CustomPaletteColors;
	}
	interface PaletteOptions {
		custom?: CustomPaletteColors;
	}
}
