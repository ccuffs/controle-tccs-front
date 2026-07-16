/**
 * Service para gerenciar chamadas de API relacionadas ao tema
 */

export type ThemeMode = "light" | "dark";

/**
 * Salva a preferência de tema do usuário no localStorage
 */
export function saveThemeToStorage(mode: ThemeMode): { success: true } {
	try {
		localStorage.setItem("theme", mode);
		return { success: true };
	} catch (error) {
		console.error("Erro ao salvar tema no localStorage:", error);
		throw new Error("Erro ao salvar preferência de tema");
	}
}

/**
 * Recupera a preferência de tema do usuário do localStorage
 */
export function getThemeFromStorage(): string | null {
	try {
		return localStorage.getItem("theme");
	} catch (error) {
		console.error("Erro ao recuperar tema do localStorage:", error);
		return null;
	}
}

// Exportação padrão para manter compatibilidade
const themeService = {
	saveThemeToStorage,
	getThemeFromStorage,
};

export default themeService;
