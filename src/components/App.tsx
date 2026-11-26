import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";

import { AuthProvider } from "../contexts/AuthContext";
import { PeriodoProvider } from "../contexts/PeriodoContext";
import ProtectedRoute from "../contexts/ProtectedRoute";

import CustomThemeProvider from "./customs/CustomThemeProvider";
import AppLayout from "./layout/AppLayout";
import EmMigracao from "./layout/EmMigracao";
import { ExigirItem, ExigirPerfil, RedirecionarInicio, RedirecionarInicioPerfil } from "./layout/guardas";
import type { Perfil } from "./layout/navegacao";
import { NoticeProvider } from "./ui";

import AvaliarDefesasOrientador from "./modulo-orientador/AvaliarDefesasOrientador";
import EmitirDeclaracoes from "./modulo-orientador/EmitirDeclaracoes";
import MembrosExternos from "./modulo-orientador/MembrosExternos";
import PerfilOrientador from "./modulo-orientador/PerfilOrientador";
import PerfilDiscente from "./modulo-dicente/PerfilDiscente";
import DesignSystem from "./paginas/DesignSystem";
import Disponibilidade from "./paginas/Disponibilidade";
import MeuTcc from "./paginas/MeuTcc";
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
							<Route path="cursos" element={pagina("coordenacao", "cursos", <CursosPagina />)} />
							<Route path="importar" element={pagina("coordenacao", "importar", <ImportarLista />)} />
							<Route path="design-system" element={pagina("coordenacao", "design-system", <DesignSystem />)} />
						</Route>

						<Route path="orientador" element={<ExigirPerfil perfil="orientador" />}>
							<Route index element={<RedirecionarInicioPerfil perfil="orientador" />} />
							<Route path="inicio" element={pagina("orientador", "inicio", <InicioOrientador />)} />
							<Route path="orientandos" element={pagina("orientador", "orientandos", <MeusOrientandos />)} />
							<Route path="temas" element={pagina("orientador", "temas", <MeusTemas />)} />
							<Route path="convites" element={pagina("orientador", "convites", <ConvitesOrientador />)} />
							<Route path="disponibilidade" element={pagina("orientador", "disponibilidade", <Disponibilidade />)} />
							<Route path="avaliacoes" element={pagina("orientador", "avaliacoes", <AvaliarDefesasOrientador />)} />
							<Route path="externos" element={pagina("orientador", "externos", <MembrosExternos />)} />
							<Route path="declaracoes" element={pagina("orientador", "declaracoes", <EmitirDeclaracoes />)} />
							<Route path="perfil" element={pagina("orientador", "perfil", <PerfilOrientador />)} />
						</Route>

						<Route path="discente" element={<ExigirPerfil perfil="discente" />}>
							<Route index element={<RedirecionarInicioPerfil perfil="discente" />} />
							<Route path="meu-tcc" element={pagina("discente", "meu-tcc", <MeuTcc />)} />
							<Route
								path="temas"
								element={pagina(
									"discente",
									"temas",
									<EmMigracao
										titulo="Temas disponíveis"
										fase="Fase 5"
										observacao="Enquanto isso, os temas aparecem na primeira etapa de Meu TCC."
									/>,
								)}
							/>
							<Route
								path="convites"
								element={pagina(
									"discente",
									"convites",
									<EmMigracao
										titulo="Meus convites"
										fase="Fase 5"
										observacao="Enquanto isso, os convites são acompanhados nas etapas de Meu TCC."
									/>,
								)}
							/>
							<Route path="perfil" element={pagina("discente", "perfil", <PerfilDiscente />)} />
						</Route>

						{/* Endereços antigos */}
						<Route path="cursos" element={<Navigate to="/coordenacao/cursos" replace />} />
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
