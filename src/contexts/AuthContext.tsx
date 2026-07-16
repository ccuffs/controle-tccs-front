import {
	createContext,
	useContext,
	useReducer,
	useEffect,
	type ReactNode,
} from "react";
import authService from "../services/authService";
import type { Grupo, Permissao, Usuario } from "../types/usuario";

interface AuthState {
	usuario: Usuario | null;
	token: string | null;
	permissoesUsuario: Permissao[];
	gruposUsuario: Grupo[];
	temConsultaTodos: boolean;
	isAuthenticated: boolean;
	loading: boolean;
}

type AuthAction =
	| { type: "LOGIN_START" }
	| { type: "LOGIN_SUCCESS"; payload: { usuario: Usuario; token: string } }
	| { type: "LOGIN_FAILURE" }
	| { type: "LOGOUT" }
	| {
			type: "SET_PERMISSOES";
			payload: {
				permissoesUsuario: Permissao[];
				gruposUsuario?: Grupo[];
				temConsultaTodos: boolean;
			};
	  }
	| { type: "SET_LOADING"; payload: boolean };

interface AuthContextValue extends AuthState {
	login: (
		userId: string,
		senha: string,
	) => Promise<{ success: boolean; error?: string }>;
	logout: () => void;
	verificarPermissao: (nomePermissao: number) => Permissao | undefined | false;
	carregarPermissoes: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export { AuthContext };

const initialState: AuthState = {
	usuario: null,
	token: localStorage.getItem("auth_token") || null,
	permissoesUsuario: [],
	gruposUsuario: [],
	temConsultaTodos: false,
	isAuthenticated: false,
	loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
	switch (action.type) {
		case "LOGIN_START":
			return { ...state, loading: true };
		case "LOGIN_SUCCESS":
			return {
				...state,
				usuario: action.payload.usuario,
				token: action.payload.token,
				isAuthenticated: true,
				loading: false,
			};
		case "LOGIN_FAILURE":
			return {
				...state,
				usuario: null,
				token: null,
				permissoesUsuario: [],
				gruposUsuario: [],
				temConsultaTodos: false,
				isAuthenticated: false,
				loading: false,
			};
		case "LOGOUT":
			return {
				...state,
				usuario: null,
				token: null,
				permissoesUsuario: [],
				gruposUsuario: [],
				temConsultaTodos: false,
				isAuthenticated: false,
				loading: false,
			};
		case "SET_PERMISSOES":
			return {
				...state,
				permissoesUsuario: action.payload.permissoesUsuario,
				gruposUsuario: action.payload.gruposUsuario || [],
				temConsultaTodos: action.payload.temConsultaTodos,
			};
		case "SET_LOADING":
			return { ...state, loading: action.payload };
		default:
			return state;
	}
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	const login = async (userId: string, senha: string) => {
		try {
			dispatch({ type: "LOGIN_START" });
			const resultado = await authService.login(userId, senha);

			localStorage.setItem("auth_token", resultado.token);

			dispatch({
				type: "LOGIN_SUCCESS",
				payload: {
					usuario: resultado.usuario,
					token: resultado.token,
				},
			});

			await carregarPermissoes();
			return { success: true };
		} catch (error) {
			dispatch({ type: "LOGIN_FAILURE" });
			return {
				success: false,
				error: error instanceof Error ? error.message : "Erro ao fazer login",
			};
		}
	};

	const logout = () => {
		localStorage.removeItem("auth_token");
		dispatch({ type: "LOGOUT" });
	};

	const carregarPermissoes = async () => {
		try {
			const dadosUsuario = await authService.getMe();

			dispatch({
				type: "SET_PERMISSOES",
				payload: {
					permissoesUsuario: dadosUsuario.permissoes || [],
					gruposUsuario: dadosUsuario.grupos || [],
					temConsultaTodos: dadosUsuario.temConsultaTodos || false,
				},
			});
		} catch (error) {
			console.error("Erro ao carregar permissões:", error);
		}
	};

	const verificarPermissao = (nomePermissao: number) => {
		if (!state.permissoesUsuario || state.permissoesUsuario.length === 0) {
			return false;
		}

		const permissao = state.permissoesUsuario.find(
			(p) => p.id === nomePermissao,
		);
		return permissao;
	};

	const verificarAutenticacao = async () => {
		const token = localStorage.getItem("auth_token");

		if (!token) {
			dispatch({ type: "SET_LOADING", payload: false });
			return;
		}

		try {
			const dadosUsuario = await authService.getMe();
			dispatch({
				type: "LOGIN_SUCCESS",
				payload: {
					usuario: dadosUsuario,
					token: token,
				},
			});
			await carregarPermissoes();
		} catch (error) {
			localStorage.removeItem("auth_token");
			dispatch({ type: "LOGIN_FAILURE" });
		} finally {
			dispatch({ type: "SET_LOADING", payload: false });
		}
	};

	useEffect(() => {
		verificarAutenticacao();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const value: AuthContextValue = {
		...state,
		login,
		logout,
		verificarPermissao,
		carregarPermissoes,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth deve ser usado dentro de um AuthProvider");
	}
	return context;
};
