import axios, {
	type AxiosRequestConfig,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import authService from "../services/authService";

const API_URL = import.meta.env.VITE_APP_API_URL;

/**
 * O interceptor de resposta (`onFulfilledResponse`) devolve `response.data`
 * diretamente em vez do `AxiosResponse` completo. Este tipo representa o
 * formato real recebido pelos `services`, já que os tipos padrão do axios
 * não descrevem essa transformação.
 */
interface TypedAxiosInstance {
	get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
	post<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T>;
	put<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T>;
	patch<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T>;
	delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
}

const axiosInstance = axios.create({
	baseURL: API_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

// Função para tratar requisições de saída
function onFulfilledRequest(config: InternalAxiosRequestConfig) {
	const token = authService.getToken();

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
}

// Função para tratar erros de requisição
function handleRequestError(error: unknown) {
	return Promise.reject(error);
}

// Função para tratar respostas de sucesso
// (retorna `response.data` em vez do `AxiosResponse`; o cast alinha essa
// transformação com a assinatura exigida por `interceptors.response.use`,
// e o `TypedAxiosInstance` acima expõe o tipo real recebido pelos services)
function onFulfilledResponse(response: AxiosResponse): AxiosResponse {
	return response.data as AxiosResponse;
}

// Função para tratar erros de resposta
async function handleResponseError(error: unknown) {
	if (!axios.isAxiosError(error)) {
		return Promise.reject(error);
	}

	const originalRequest = error.config as RetryableRequestConfig | undefined;
	const isAuthenticationRequest = ["/auth/login", "/auth/refresh"].some(
		(path) => originalRequest?.url?.endsWith(path),
	);

	// Deixa o formulário tratar falhas de login sem recarregar a página.
	if (isAuthenticationRequest) {
		return Promise.reject(error);
	}

	if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
		originalRequest._retry = true;

		const token = authService.getToken();

		if (token && !authService.isTokenExpired(token)) {
			try {
				const newToken = await authService.refreshToken();
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return axiosInstance(originalRequest);
			} catch {
				authService.removeToken();
				window.location.href = "/login";
				return Promise.reject(
					new Error("Sessão expirada. Faça login novamente."),
				);
			}
		} else {
			authService.removeToken();
			window.location.href = "/login";
			return Promise.reject(
				new Error("Sessão expirada. Faça login novamente."),
			);
		}
	}

	return Promise.reject(error);
}

// Aplicar interceptors
axiosInstance.interceptors.request.use(onFulfilledRequest, handleRequestError);
axiosInstance.interceptors.response.use(
	onFulfilledResponse,
	handleResponseError,
);

export default axiosInstance as unknown as TypedAxiosInstance;
