interface DicenteResponse {
	matricula?: string;
}

interface TccResponse {
	etapa?: number | null;
}

/**
 * Processa a resposta do dicente para extrair a matrícula
 */
export function processDicenteResponse(
	response: DicenteResponse | null | undefined,
): string | null {
	return response?.matricula || null;
}

/**
 * Processa a resposta do TCC para extrair a etapa
 */
export function processTccResponse(
	response: TccResponse | null | undefined,
): number {
	return response?.etapa || 0;
}

/**
 * Obtém a etapa inicial baseada nos dados carregados
 */
export function getEtapaInicial(
	dicenteData: unknown,
	tccData: TccResponse | null | undefined,
): number {
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
