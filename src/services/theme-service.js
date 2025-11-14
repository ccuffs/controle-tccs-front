/**
 * Service para gerenciar chamadas de API relacionadas ao tema
 */

/**
 * Salva a preferência de tema do usuário no localStorage
 * @param {string} mode - Modo do tema ('light' ou 'dark')
 */
export function saveThemeToStorage(mode) {
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
 * @returns {string|null} - Modo do tema ou null se não encontrado
 */
export function getThemeFromStorage() {
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
