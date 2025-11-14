import { useState, useEffect, useCallback } from "react";
import themeService from "../services/theme-service.js";
import themeController from "../controllers/theme-controller.js";

/**
 * Hook para gerenciar o tema da aplicação
 * Responsável por controlar os hooks do React e a lógica de tela
 * Chamadas de API são feitas através do themeService
 * Processamento de dados é feito através do themeController
 */
export function useTheme() {
	// Estado inicial do tema
	const [mode, setMode] = useState(() => {
		const storedTheme = themeService.getThemeFromStorage();
		return themeController.processStoredTheme(storedTheme);
	});

	// Carregar tema do storage na inicialização
	useEffect(() => {
		const storedTheme = themeService.getThemeFromStorage();
		const processedTheme = themeController.processStoredTheme(storedTheme);
		setMode(processedTheme);
	}, []);

	// Função para alternar o tema
	const toggleTheme = useCallback(() => {
		setMode((prevMode) => {
			const newMode = themeController.getToggledThemeMode(prevMode);
			try {
				themeService.saveThemeToStorage(newMode);
			} catch (error) {
				console.error("Erro ao salvar tema:", error);
			}
			return newMode;
		});
	}, []);

	return {
		mode,
		toggleTheme,
	};
}
