import axios from "axios";

interface ApiErrorPayload {
	message?: string;
}

/**
 * Replica a extração `error.response?.data?.message || error.message || fallback`
 * usada em todos os services/controllers, mas com o narrowing exigido pelo
 * TypeScript estrito (o `catch` tipa o erro como `unknown`).
 */
export function getErrorMessage(error: unknown, fallback: string): string {
	if (axios.isAxiosError<ApiErrorPayload>(error)) {
		return error.response?.data?.message || error.message || fallback;
	}

	if (error instanceof Error) {
		return error.message || fallback;
	}

	return fallback;
}
