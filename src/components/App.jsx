import { Container, Box, Toolbar } from "@mui/material";
import { Route, Routes } from "react-router";
import React from "react";

import Navbar from "./Navbar";
import Login from "./Login";
import ProtectedRoute from "../contexts/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { Permissoes } from "../enums/permissoes";

import Cursos from "./Cursos";
import Orientadores from "./Orientadores";
import Dicentes from "./Dicentes";
import Orientacao from "./Orientacao";
import TemasTcc from "./TemasTcc";
import ModuloOrientador from "./ModuloOrientador";
import ModuloDiscente from "./ModuloDiscente";
import CustomThemeProvider from "./CustomThemeProvider";
import ThemeSwitch from "./ThemeSwitch";
import { AuthProvider } from "../contexts/AuthContext";
import Dashboard from "./Dashboard";

// Contexto para gerenciar o estado do drawer
export const DrawerContext = React.createContext();

// Componente para roteamento condicional baseado no grupo do usuário
function ConditionalRoute() {
	const { gruposUsuario, loading } = useAuth();

	// Aguarda o carregamento dos dados
	if (loading) {
		return null; // O ProtectedRoute já mostra loading
	}

	// Verifica se o usuário pertence aos grupos específicos
	const isAdmin = gruposUsuario.some(
		(grupo) => grupo.id === Permissoes.GRUPOS.ADMIN,
	);
	const isProfessor = gruposUsuario.some(
		(grupo) => grupo.id === Permissoes.GRUPOS.PROFESSOR,
	);
	const isOrientador = gruposUsuario.some(
		(grupo) => grupo.id === Permissoes.GRUPOS.ORIENTADOR,
	);
	const isEstudante = gruposUsuario.some(
		(grupo) => grupo.id === Permissoes.GRUPOS.ESTUDANTE,
	);

	// Lógica de roteamento baseada nas regras especificadas
	if (isAdmin) {
		return <Dashboard />;
	} else if (isProfessor) {
		return <Dashboard />;
	} else if (isOrientador) {
		return <ModuloOrientador />;
	} else if (isEstudante) {
		return <ModuloDiscente />;
	}

	// Fallback para Dashboard caso não se encaixe em nenhuma regra
	console.log("Redirecionando para Dashboard (fallback)");
	return <Dashboard />;
}

function App() {
	const [desktopOpen, setDesktopOpen] = React.useState(false);

	return (
		<AuthProvider>
			<CustomThemeProvider>
				<DrawerContext.Provider value={{ desktopOpen, setDesktopOpen }}>
					<AppContent />
				</DrawerContext.Provider>
			</CustomThemeProvider>
		</AuthProvider>
	);
}

function AppContent() {
	const { gruposUsuario } = useAuth();
	const { desktopOpen } = React.useContext(DrawerContext);

	// Verifica se o usuário é um estudante
	const isEstudante = gruposUsuario.some(
		(grupo) => grupo.id === Permissoes.GRUPOS.ESTUDANTE,
	);

	return (
		<Box sx={{ display: "flex" }}>
			<Navbar />
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: 3,
					width: "100%",
					transition: (theme) =>
						theme.transitions.create(["width", "margin"], {
							easing: theme.transitions.easing.sharp,
							duration: theme.transitions.duration.leavingScreen,
						}),
				}}
			>
				<Toolbar /> {/* Spacing for AppBar */}
				<ThemeSwitch />
				<Container maxWidth="xl" sx={{ mt: 2 }}>
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route
							path="/"
							element={
								<ProtectedRoute>
									<ConditionalRoute />
								</ProtectedRoute>
							}
						/>
						<Route
							path="cursos"
							element={
								<ProtectedRoute>
									<Cursos />
								</ProtectedRoute>
							}
						/>
						<Route
							path="orientadores"
							element={
								<ProtectedRoute>
									<Orientadores />
								</ProtectedRoute>
							}
						/>
						<Route
							path="dicentes"
							element={
								<ProtectedRoute>
									<Dicentes />
								</ProtectedRoute>
							}
						/>
						<Route
							path="orientacoes"
							element={
								<ProtectedRoute>
									<Orientacao />
								</ProtectedRoute>
							}
						/>
						<Route
							path="temas-tcc"
							element={
								<ProtectedRoute>
									<TemasTcc />
								</ProtectedRoute>
							}
						/>
						<Route
							path="modulo-orientador"
							element={
								<ProtectedRoute>
									<ModuloOrientador />
								</ProtectedRoute>
							}
						/>
						<Route
							path="modulo-discente"
							element={
								<ProtectedRoute>
									<ModuloDiscente />
								</ProtectedRoute>
							}
						/>
					</Routes>
				</Container>
			</Box>
		</Box>
	);
}

export default App;
