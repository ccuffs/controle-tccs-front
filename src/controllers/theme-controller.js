/**
 * Controller para processar e validar dados relacionados ao tema
 */

/**
 * Valida se o modo é válido
 * @param {string} mode - Modo do tema a ser validado
 * @returns {boolean} - true se válido, false caso contrário
 */
export function isValidThemeMode(mode) {
	return mode === "light" || mode === "dark";
}

/**
 * Obtém o modo padrão do tema
 * @returns {string} - Modo padrão ('light')
 */
export function getDefaultThemeMode() {
	return "light";
}

/**
 * Processa e valida o tema recuperado do storage
 * @param {string|null} storedTheme - Tema armazenado no localStorage
 * @returns {string} - Modo do tema válido
 */
export function processStoredTheme(storedTheme) {
	if (storedTheme && isValidThemeMode(storedTheme)) {
		return storedTheme;
	}
	return getDefaultThemeMode();
}

/**
 * Alterna entre os modos de tema
 * @param {string} currentMode - Modo atual do tema
 * @returns {string} - Novo modo do tema
 */
export function getToggledThemeMode(currentMode) {
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

