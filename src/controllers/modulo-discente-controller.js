/**
 * Processa a resposta do dicente para extrair a matrícula
 */
export function processDicenteResponse(response) {
	return response?.matricula || null;
}

/**
 * Processa a resposta do TCC para extrair a etapa
 */
export function processTccResponse(response) {
	return response?.etapa || 0;
}

/**
 * Obtém a etapa inicial baseada nos dados carregados
 */
export function getEtapaInicial(dicenteData, tccData) {
	if (!dicenteData) {
		return 0; // Se não existe dicente, começa na etapa 0
	}

	if (tccData) {
		return processTccResponse(tccData); // Se existe TCC, retorna a etapa do TCC
	}

	return 0; // Se não existe TCC, começa na etapa 0
}

// Exportação padrão
const moduloDiscenteController = {
	processDicenteResponse,
	processTccResponse,
	getEtapaInicial,
};

export default moduloDiscenteController;
