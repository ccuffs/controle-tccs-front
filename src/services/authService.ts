import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Usuario } from "../types/usuario";

interface LoginResponse {
	token: string;
	usuario: Usuario;
}

interface RefreshResponse {
	token: string;
}

export async function login(
	userId: string,
	senha: string,
): Promise<LoginResponse> {
	try {
		const response = await axiosInstance.post<LoginResponse>("/auth/login", {
			userId,
			senha,
		});
		return response;
	} catch (error) {
		throw new Error(getErrorMessage(error, "Erro ao conectar com o servidor"));
	}
}

export async function logout(): Promise<void> {
	try {
		await axiosInstance.post("/auth/logout");
	} catch (error) {
		console.error("Erro no logout:", error);
	}
}

export async function getMe(): Promise<Usuario> {
	try {
		const response = await axiosInstance.get<{ usuario: Usuario }>("/auth/me");
		return response.usuario;
	} catch (error) {
		throw new Error(getErrorMessage(error, "Erro ao conectar com o servidor"));
	}
}

export async function refreshToken(): Promise<string> {
	try {
		const token = localStorage.getItem("auth_token");

		if (!token) {
			throw new Error("Token não encontrado");
		}

		const response = await axiosInstance.post<RefreshResponse>(
			"/auth/refresh",
			{ token },
		);
		localStorage.setItem("auth_token", response.token);
		return response.token;
	} catch (error) {
		throw new Error(getErrorMessage(error, "Erro ao conectar com o servidor"));
	}
}

export async function validateToken(): Promise<boolean> {
	try {
		const token = localStorage.getItem("auth_token");

		if (!token) {
			return false;
		}

		await axiosInstance.post("/auth/validate", {
			token,
		});
		return true;
	} catch {
		return false;
	}
}

export function getToken(): string | null {
	return localStorage.getItem("auth_token");
}

export function setToken(token: string): void {
	localStorage.setItem("auth_token", token);
}

export function removeToken(): void {
	localStorage.removeItem("auth_token");
}

export function isTokenExpired(token: string): boolean {
	if (!token) return true;

	try {
		const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
		const currentTime = Date.now() / 1000;
		return payload.exp < currentTime;
	} catch {
		return true;
	}
}

// Exportação padrão para manter compatibilidade com imports existentes
const authService = {
	login,
	logout,
	getMe,
	refreshToken,
	validateToken,
	getToken,
	setToken,
	removeToken,
	isTokenExpired,
};

export default authService;
