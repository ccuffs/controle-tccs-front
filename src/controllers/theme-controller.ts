import type { ThemeMode } from "../services/theme-service";

/**
 * Controller para processar e validar dados relacionados ao tema
 */

/**
 * Valida se o modo é válido
 */
export function isValidThemeMode(mode: string | null): mode is ThemeMode {
	return mode === "light" || mode === "dark";
}

/**
 * Obtém o modo padrão do tema
 */
export function getDefaultThemeMode(): ThemeMode {
	return "light";
}

/**
 * Processa e valida o tema recuperado do storage
 */
export function processStoredTheme(storedTheme: string | null): ThemeMode {
	if (storedTheme && isValidThemeMode(storedTheme)) {
		return storedTheme;
	}
	return getDefaultThemeMode();
}

/**
 * Alterna entre os modos de tema
 */
export function getToggledThemeMode(currentMode: ThemeMode): ThemeMode {
	return currentMode === "light" ? "dark" : "light";
}

// Exportação padrão para manter compatibilidade
const themeController = {
	isValidThemeMode,
	getDefaultThemeMode,
	processStoredTheme,
	getToggledThemeMode,
};

export default themeController;
