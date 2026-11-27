import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";

import { AuthProvider } from "../contexts/AuthContext";
import { PeriodoProvider } from "../contexts/PeriodoContext";
import ProtectedRoute from "../contexts/ProtectedRoute";

import CustomThemeProvider from "./customs/CustomThemeProvider";
import AppLayout from "./layout/AppLayout";
import { ExigirItem, ExigirPerfil, RedirecionarInicio, RedirecionarInicioPerfil } from "./layout/guardas";
import type { Perfil } from "./layout/navegacao";
import { NoticeProvider } from "./ui";

import DesignSystem from "./paginas/DesignSystem";
import Disponibilidade from "./paginas/Disponibilidade";
import MeuTcc from "./discente/MeuTcc";
import TemasDisponiveis from "./discente/Temas";
import ConvitesDiscente from "./discente/Convites";
import PerfilDiscenteNovo from "./discente/Perfil";
import Login from "./utils/Login";
import Discentes from "./cadastros/Discentes";
import Docentes from "./cadastros/Docentes";
import Temas from "./cadastros/Temas";
import CursosPagina from "./cadastros/CursosPagina";
import Orientacoes from "./orientacoes/Orientacoes";
import Defesas from "./defesas/Defesas";
import ImportarLista from "./importar/ImportarLista";
import VisaoGeral from "./visao-geral/VisaoGeral";
import InicioOrientador from "./orientador/Inicio";
import ConvitesOrientador from "./orientador/Convites";
import MeusOrientandos from "./orientador/MeusOrientandos";
import MeusTemas from "./orientador/MeusTemas";
import PerfilDocente from "./orientador/Perfil";
import DeclaracoesDocente from "./orientador/Declaracoes";
import MembrosExternosDocente from "./orientador/MembrosExternos";
import AvaliacoesDocente from "./orientador/Avaliacoes";
import InicioBanca from "./banca/Inicio";

/** Página de um item do menu: só abre se o item for permitido ao usuário. */
function pagina(perfil: Perfil, id: string, elemento: ReactNode) {
	return (
		<ExigirItem perfil={perfil} id={id}>
			{elemento}
		</ExigirItem>
	);
}

function App() {
	return (
		<AuthProvider>
			<CustomThemeProvider>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route
						element={
							<ProtectedRoute>
								<PeriodoProvider>
									<NoticeProvider>
										<AppLayout />
									</NoticeProvider>
								</PeriodoProvider>
							</ProtectedRoute>
						}
					>
						<Route index element={<RedirecionarInicio />} />

						<Route path="coordenacao" element={<ExigirPerfil perfil="coordenacao" />}>
							<Route index element={<RedirecionarInicioPerfil perfil="coordenacao" />} />
							<Route path="visao-geral" element={pagina("coordenacao", "visao-geral", <VisaoGeral />)} />
							<Route path="orientacoes" element={pagina("coordenacao", "orientacoes", <Orientacoes />)} />
							<Route path="defesas" element={pagina("coordenacao", "defesas", <Defesas />)} />
							<Route path="discentes" element={pagina("coordenacao", "discentes", <Discentes />)} />
							<Route path="docentes" element={pagina("coordenacao", "docentes", <Docentes />)} />
							<Route path="temas" element={pagina("coordenacao", "temas", <Temas />)} />
							<Route path="cursos" element={<Navigate to="/administracao/cursos" replace />} />
							<Route path="importar" element={pagina("coordenacao", "importar", <ImportarLista />)} />
							<Route path="design-system" element={<Navigate to="/administracao/design-system" replace />} />
						</Route>

						<Route path="orientador" element={<ExigirPerfil perfil="orientador" />}>
							<Route index element={<RedirecionarInicioPerfil perfil="orientador" />} />
							<Route path="inicio" element={pagina("orientador", "inicio", <InicioOrientador />)} />
							<Route path="orientandos" element={pagina("orientador", "orientandos", <MeusOrientandos />)} />
							<Route path="temas" element={pagina("orientador", "temas", <MeusTemas />)} />
							<Route path="convites" element={pagina("orientador", "convites", <ConvitesOrientador />)} />
							<Route path="disponibilidade" element={pagina("orientador", "disponibilidade", <Disponibilidade />)} />
							<Route path="avaliacoes" element={pagina("orientador", "avaliacoes", <AvaliacoesDocente />)} />
							<Route path="externos" element={pagina("orientador", "externos", <MembrosExternosDocente />)} />
							<Route path="declaracoes" element={pagina("orientador", "declaracoes", <DeclaracoesDocente />)} />
							<Route path="perfil" element={pagina("orientador", "perfil", <PerfilDocente />)} />
						</Route>

						<Route path="banca" element={<ExigirPerfil perfil="banca" />}>
							<Route index element={<RedirecionarInicioPerfil perfil="banca" />} />
							<Route path="inicio" element={pagina("banca", "inicio", <InicioBanca />)} />
							<Route path="convites" element={pagina("banca", "convites", <ConvitesOrientador />)} />
							<Route path="disponibilidade" element={pagina("banca", "disponibilidade", <Disponibilidade />)} />
							<Route path="avaliacoes" element={pagina("banca", "avaliacoes", <AvaliacoesDocente />)} />
							<Route path="declaracoes" element={pagina("banca", "declaracoes", <DeclaracoesDocente />)} />
							<Route path="perfil" element={pagina("banca", "perfil", <PerfilDocente />)} />
						</Route>

						<Route path="discente" element={<ExigirPerfil perfil="discente" />}>
							<Route index element={<RedirecionarInicioPerfil perfil="discente" />} />
							<Route path="meu-tcc" element={pagina("discente", "meu-tcc", <MeuTcc />)} />
							<Route path="temas" element={pagina("discente", "temas", <TemasDisponiveis />)} />
							<Route path="convites" element={pagina("discente", "convites", <ConvitesDiscente />)} />
							<Route path="perfil" element={pagina("discente", "perfil", <PerfilDiscenteNovo />)} />
						</Route>

						<Route path="administracao" element={<ExigirPerfil perfil="administracao" />}>
							<Route index element={<RedirecionarInicioPerfil perfil="administracao" />} />
							<Route path="cursos" element={pagina("administracao", "cursos", <CursosPagina />)} />
							<Route path="design-system" element={pagina("administracao", "design-system", <DesignSystem />)} />
						</Route>

						{/* Endereços antigos */}
						<Route path="cursos" element={<Navigate to="/administracao/cursos" replace />} />
						<Route path="orientadores" element={<Navigate to="/coordenacao/docentes" replace />} />
						<Route path="dicentes" element={<Navigate to="/coordenacao/discentes" replace />} />
						<Route path="orientacoes" element={<Navigate to="/coordenacao/orientacoes" replace />} />
						<Route path="temas-tcc" element={<Navigate to="/coordenacao/temas" replace />} />
						<Route path="modulo-orientador" element={<Navigate to="/orientador" replace />} />
						<Route path="modulo-discente" element={<Navigate to="/discente/meu-tcc" replace />} />

						<Route path="*" element={<RedirecionarInicio />} />
					</Route>
				</Routes>
			</CustomThemeProvider>
		</AuthProvider>
	);
}

export default App;
