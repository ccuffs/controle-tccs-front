import React from "react";
import { Box, Grid, Typography, Stack } from "@mui/material";

import { useDashboard } from "../hooks/useDashboard.js";
import FiltrosPesquisa from "./utils/FiltrosPesquisa";
import GraficoEstudantesOrientador from "./dashboard/GraficoEstudantesOrientador";
import GraficoDistribuicaoEtapas from "./dashboard/GraficoDistribuicaoEtapas";
import TabelaDefesasAgendadas from "./dashboard/TabelaDefesasAgendadas";
import GraficoConvitesOrientacao from "./dashboard/GraficoConvitesOrientacao";
import GraficoConvitesBanca from "./dashboard/GraficoConvitesBanca";
import GraficoConvitesPeriodo from "./dashboard/GraficoConvitesPeriodo";
import GraficoOrientandosPorDocente from "./dashboard/GraficoOrientandosPorDocente";
import GraficoDefesasPorDocente from "./dashboard/GraficoDefesasPorDocente";

export default function Dashboard({ forceOrientador = false }) {
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
					habilitarCurso={
						isAdmin ||
						(isProfessor && cursosUsuario?.length > 0) ||
						isOrientadorView
					}
					habilitarAno
					habilitarSemestre
					habilitarFase={isAdmin || isProfessor || isOrientadorView}
					mostrarTodosCursos={isAdmin}
					loading={loadingFiltros}
				/>
			</Stack>

			<Grid container spacing={2} sx={{ mt: 3 }}>
				{/* Gráfico 1: Estudantes com orientador definido na oferta e Donut por etapa, lado a lado */}
				{(isAdmin || isProfessor) && (
					<>
						<Grid item xs={12} md={4} lg={4}>
							<GraficoEstudantesOrientador
								dadosGraficoOrientador={dadosGraficoOrientador}
								faseLabel={faseLabel}
								largura={396}
							/>
						</Grid>
						{/* Donut por etapa ao lado */}
						<Grid item xs={12} md={4} lg={4}>
							<GraficoDistribuicaoEtapas
								dadosEtapas={dadosEtapas}
								faseLabel={faseLabel}
								largura={396}
							/>
						</Grid>
						{/* Tabela de Defesas agendadas ao lado */}
						<Grid item xs={12} md={4} lg={4}>
							<TabelaDefesasAgendadas
								defesasAgendadas={defesasAgendadas}
								largura={580}
							/>
						</Grid>
					</>
				)}
			</Grid>

			{/* Orientador (apenas quando forçado em ModuloOrientador):
          1ª linha → Etapas, Convites orientação, Convites banca
          2ª linha → Convites no período, Defesas agendadas */}
			{!isAdmin && !isProfessor && isOrientador && isOrientadorView && (
				<>
					<Grid container spacing={2} sx={{ mt: 3 }}>
						{/* Distribuição por etapa */}
						<Grid item xs={12} md={4} lg={4}>
							<GraficoDistribuicaoEtapas
								dadosEtapas={dadosEtapas}
								faseLabel={faseLabel}
							/>
						</Grid>
						{/* Convites orientação (donut) */}
						<Grid item xs={12} md={4} lg={4}>
							<GraficoConvitesOrientacao
								convitesOrientacaoStatus={
									convitesOrientacaoStatus
								}
								faseLabel={faseLabel}
							/>
						</Grid>
						{/* Convites banca (donut) */}
						<Grid item xs={12} md={4} lg={4}>
							<GraficoConvitesBanca
								convitesBancaStatus={convitesBancaStatus}
								faseLabel={faseLabel}
							/>
						</Grid>
					</Grid>

					<Grid container spacing={2} sx={{ mt: 3 }}>
						{/* Convites enviados no período (linha) */}
						<Grid item xs={12} md={8}>
							<GraficoConvitesPeriodo
								dadosConvites={dadosConvites}
								faseLabel={faseLabel}
								ticksConvites={ticksConvites}
							/>
						</Grid>
						{/* Defesas agendadas */}
						<Grid item xs={12} md={4} lg={4}>
							<TabelaDefesasAgendadas
								defesasAgendadas={defesasAgendadas}
								largura={666}
							/>
						</Grid>
					</Grid>
				</>
			)}

			{/* Gráficos 2 e 3: Orientandos por docente e Defesas aceitas por docente lado a lado */}
			{(isAdmin || isProfessor) && (
				<Grid container spacing={2} sx={{ mt: 3 }}>
					{/* Gráfico 2: Barras horizontais - Orientandos por docente */}
					<Grid item xs={12} md={6} lg={6}>
						<GraficoOrientandosPorDocente
							dadosDocentes={dadosDocentes}
							faseLabel={faseLabel}
							alturaDocentes={alturaDocentes}
						/>
					</Grid>

					{/* Gráfico 3: Barras horizontais - Defesas aceitas por docente */}
					<Grid item xs={12} md={6} lg={6}>
						<GraficoDefesasPorDocente
							dadosDefesasDocentes={dadosDefesasDocentes}
							faseLabel={faseLabel}
							alturaDefesas={alturaDefesas}
						/>
					</Grid>
				</Grid>
			)}

			{/* Gráfico 4: Linha - Convites enviados no período (por tipo) e Donuts de convites */}
			{(isAdmin ||
				isProfessor ||
				(isOrientador && !isOrientadorView)) && (
				<Grid container spacing={2} sx={{ mt: 3 }}>
					<Grid item xs={12} md={8}>
						<GraficoConvitesPeriodo
							dadosConvites={dadosConvites}
							faseLabel={faseLabel}
							ticksConvites={ticksConvites}
							largura={580}
						/>
					</Grid>
					{/* Donut: Convites de orientação (respondidos x pendentes) ao lado */}
					<Grid item xs={12} md={4} lg={4}>
						<GraficoConvitesOrientacao
							convitesOrientacaoStatus={convitesOrientacaoStatus}
							faseLabel={faseLabel}
							largura={396}
						/>
					</Grid>
					{/* Donut: Convites de banca (respondidos x pendentes) */}
					<Grid item xs={12} md={4} lg={4}>
						<GraficoConvitesBanca
							convitesBancaStatus={convitesBancaStatus}
							faseLabel={faseLabel}
							largura={396}
						/>
					</Grid>
				</Grid>
			)}
		</Box>
	);
}
