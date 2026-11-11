import { Box, Grid, Typography, Stack } from "@mui/material";

import { useDashboard } from "../hooks/useDashboard";
import FiltrosPesquisa from "./utils/FiltrosPesquisa";
import GraficoEstudantesOrientador from "./dashboard/GraficoEstudantesOrientador";
import GraficoDistribuicaoEtapas from "./dashboard/GraficoDistribuicaoEtapas";
import TabelaDefesasAgendadas from "./dashboard/TabelaDefesasAgendadas";
import GraficoConvitesOrientacao from "./dashboard/GraficoConvitesOrientacao";
import GraficoConvitesBanca from "./dashboard/GraficoConvitesBanca";
import GraficoConvitesPeriodo from "./dashboard/GraficoConvitesPeriodo";
import GraficoOrientandosPorDocente from "./dashboard/GraficoOrientandosPorDocente";
import GraficoDefesasPorDocente from "./dashboard/GraficoDefesasPorDocente";
import ListaEstudantesSemConviteBanca from "./dashboard/ListaEstudantesSemConviteBanca";
import ListaDocentesSemDisponibilidadeBanca from "./dashboard/ListaDocentesSemDisponibilidadeBanca";

interface DashboardProps {
	forceOrientador?: boolean;
}

export default function Dashboard({ forceOrientador = false }: DashboardProps) {
	const {
		isAdmin,
		isProfessor,
		isOrientador,
		isOrientadorView,
		filtroAno,
		setFiltroAno,
		filtroSemestre,
		setFiltroSemestre,
		filtroFase,
		setFiltroFase,
		filtroCurso,
		setFiltroCurso,
		cursosUsuario,
		todosCursos,
		loadingFiltros,
		dadosGraficoOrientador,
		dadosEtapas,
		dadosConvites,
		convitesOrientacaoStatus,
		dadosDocentes,
		convitesBancaStatus,
		dadosDefesasDocentes,
		defesasAgendadas,
		estudantesSemConviteBanca,
		docentesSemDisponibilidadeBanca,
		alturaDocentes,
		alturaDefesas,
		faseLabel,
		ticksConvites,
	} = useDashboard({ forceOrientador });

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 2 }}>
				Dashboard
			</Typography>

			{/* Filtros globais */}
			<Stack spacing={2} sx={{ width: isOrientadorView ? 1340 : 1400 }}>
				<FiltrosPesquisa
					cursoSelecionado={filtroCurso}
					setCursoSelecionado={setFiltroCurso}
					ano={filtroAno}
					setAno={setFiltroAno}
					semestre={filtroSemestre}
					setSemestre={setFiltroSemestre}
					fase={filtroFase}
					setFase={setFiltroFase}
					cursos={isAdmin ? todosCursos : cursosUsuario}
					habilitarCurso={Boolean(
						isAdmin ||
							(isProfessor && cursosUsuario?.length > 0) ||
							isOrientadorView,
					)}
					habilitarAno
					habilitarSemestre
					habilitarFase={Boolean(isAdmin || isProfessor || isOrientadorView)}
					mostrarTodosCursos={isAdmin}
					loading={loadingFiltros}
				/>
			</Stack>

			{/* Linha 1 (admin/coordenador): Estudantes com orientador + Distribuição etapas + Defesas agendadas */}
			{(isAdmin || isProfessor) && (
				<Grid container spacing={2} sx={{ mt: 3 }}>
					<Grid size={{ xs: 12, md: 4, lg: 4 }} sx={{ display: "flex" }}>
					<GraficoEstudantesOrientador
						dadosGraficoOrientador={dadosGraficoOrientador}
						faseLabel={faseLabel}
					/>
					</Grid>
					<Grid size={{ xs: 12, md: 4, lg: 4 }} sx={{ display: "flex" }}>
					<GraficoDistribuicaoEtapas
						dadosEtapas={dadosEtapas}
						faseLabel={faseLabel}
					/>
					</Grid>
					<Grid size={{ xs: 12, md: 4, lg: 4 }} sx={{ display: "flex" }}>
					<TabelaDefesasAgendadas
						defesasAgendadas={defesasAgendadas}
					/>
					</Grid>
				</Grid>
			)}

			{/* Orientador (apenas quando forçado em ModuloOrientador):
			    1ª linha → Etapas, Convites orientação, Convites banca
			    2ª linha → Convites no período, Defesas agendadas */}
			{!isAdmin && !isProfessor && isOrientador && isOrientadorView && (
				<>
					<Grid container spacing={2} sx={{ mt: 3 }}>
						<Grid size={{ xs: 12, md: 4, lg: 4 }} sx={{ display: "flex" }}>
							<GraficoDistribuicaoEtapas
								dadosEtapas={dadosEtapas}
								faseLabel={faseLabel}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 4, lg: 4 }} sx={{ display: "flex" }}>
							<GraficoConvitesOrientacao
								convitesOrientacaoStatus={convitesOrientacaoStatus}
								faseLabel={faseLabel}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 4, lg: 4 }} sx={{ display: "flex" }}>
							<GraficoConvitesBanca
								convitesBancaStatus={convitesBancaStatus}
								faseLabel={faseLabel}
							/>
						</Grid>
					</Grid>

					<Grid container spacing={2} sx={{ mt: 3 }}>
						<Grid size={{ xs: 12, md: 8 }} sx={{ display: "flex" }}>
							<GraficoConvitesPeriodo
								dadosConvites={dadosConvites}
								faseLabel={faseLabel}
								ticksConvites={ticksConvites}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 4, lg: 4 }} sx={{ display: "flex" }}>
						<TabelaDefesasAgendadas
							defesasAgendadas={defesasAgendadas}
						/>
						</Grid>
					</Grid>
				</>
			)}

			{/* Linha 2 (admin/coordenador): Orientandos por docente + Bancas aceitas por docente */}
			{(isAdmin || isProfessor) && (
				<Grid container spacing={2} sx={{ mt: 3 }}>
					<Grid size={{ xs: 12, md: 6, lg: 6 }} sx={{ display: "flex" }}>
						<GraficoOrientandosPorDocente
							dadosDocentes={dadosDocentes}
							faseLabel={faseLabel}
							alturaDocentes={alturaDocentes}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6, lg: 6 }} sx={{ display: "flex" }}>
						<GraficoDefesasPorDocente
							dadosDefesasDocentes={dadosDefesasDocentes}
							faseLabel={faseLabel}
							alturaDefesas={alturaDefesas}
						/>
					</Grid>
				</Grid>
			)}

		{/* Linha 3 (admin/coordenador): Estudantes sem convite + Docentes sem disponibilidade */}
		{(isAdmin || isProfessor) && (
			<Grid container spacing={2} sx={{ mt: 3 }}>
				<Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
					<ListaEstudantesSemConviteBanca
						estudantes={estudantesSemConviteBanca}
						faseLabel={faseLabel}
						alturaConteudo={Math.max(alturaDocentes, alturaDefesas)}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
					<ListaDocentesSemDisponibilidadeBanca
						docentes={docentesSemDisponibilidadeBanca}
						faseLabel={faseLabel}
						alturaConteudo={Math.max(alturaDocentes, alturaDefesas)}
					/>
				</Grid>
			</Grid>
		)}

		{/* Linha 4 (admin/coordenador): Convites no período + Donuts de convites orientação e banca */}
		{(isAdmin || isProfessor) && (
			<Grid container spacing={2} sx={{ mt: 3 }}>
				<Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
					<GraficoConvitesPeriodo
						dadosConvites={dadosConvites}
						faseLabel={faseLabel}
						ticksConvites={ticksConvites}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex" }}>
					<GraficoConvitesOrientacao
						convitesOrientacaoStatus={convitesOrientacaoStatus}
						faseLabel={faseLabel}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex" }}>
					<GraficoConvitesBanca
						convitesBancaStatus={convitesBancaStatus}
						faseLabel={faseLabel}
					/>
				</Grid>
			</Grid>
		)}
		</Box>
	);
}
