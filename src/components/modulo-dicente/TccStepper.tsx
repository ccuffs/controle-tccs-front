import { useEffect, useState } from "react";
import ConviteOrientadorModal from "./ConviteOrientadorModal";
import ConviteBancaModal from "./ConviteBancaModal";
import { Button as BotaoDesign, EmptyState, useNotice } from "../ui";
import EtapaTemaTituloResumo from "../discente/etapas/EtapaTemaTituloResumo";
import EtapaEscolherOrientador from "../discente/etapas/EtapaEscolherOrientador";
import EtapaConviteBanca from "../discente/etapas/EtapaConviteBanca";
import EtapaAgendarDefesa from "../discente/etapas/EtapaAgendarDefesa";
import EtapaSeminario from "../discente/etapas/EtapaSeminario";
import EtapaDefesaResultado from "../discente/etapas/EtapaDefesaResultado";
import { TccAnterior, TccConcluido } from "../discente/etapas/TccAnterior";
import { useJornadaTcc } from "./useJornadaTcc";
import type { ContextoTcc } from "./useJornadaTcc";

export type { ContextoTcc };

interface TccStepperProps {
	etapaInicial?: number;
	onEtapaChange?: (etapa: number) => void;
	onContexto?: (contexto: ContextoTcc) => void;
}

/**
 * Conteúdo da jornada do discente (tela "Meu TCC"): cada etapa do stepper é um componente em
 * components/discente/etapas; as regras ficam em useJornadaTcc. A página exibe oferta, passos e cabeçalho.
 */
export default function TccStepper({ etapaInicial = 0, onEtapaChange, onContexto }: TccStepperProps) {
	const {
		activeStep,
		setActiveStep,
		loading,
		saving,
		trabalhoConclusao,
		ofertaAtual,
		formData,
		openMessage,
		messageText,
		messageSeverity,
		openConviteModal,
		conviteExistente,
		convitesBanca,
		openConviteBancaModal,
		openConviteBancaFinalModal,
		tccAnterior,
		openImportModal,
		showCompletedMessage,
		modalType,
		selectedHorarioBancaFase1,
		setSelectedHorarioBancaFase1,
		selectedHorarioBancaFase2,
		setSelectedHorarioBancaFase2,
		defesasFase1,
		defesasFase2,
		temDefesaAgendada,
		getEtapasValidas,
		validarEtapaAtual,
		handleNext,
		handleBack,
		handleInputChange,
		handleOpenConviteModal,
		handleCloseConviteModal,
		handleOpenConviteBancaModal,
		handleCloseConviteBancaModal,
		handleOpenConviteBancaFinalModal,
		handleCloseConviteBancaFinalModal,
		handleConviteEnviado,
		handleConviteBancaEnviado,
		handleImportModalClose,
		handleImportData,
		handleCloseMessage,
		salvarTemaTituloResumo,
		salvarRascunho,
		reabrirImportacao,
	} = useJornadaTcc({ etapaInicial, onEtapaChange, onContexto });

	// Docente escolhido no catálogo da etapa 0 (pré-seleciona o diálogo de convite).
	const [orientadorSugerido, setOrientadorSugerido] = useState<string | undefined>(undefined);

	// Avisos no Snackbar único do app (useNotice), como nas demais telas do novo design.
	const notificar = useNotice();
	useEffect(() => {
		if (!openMessage) return;
		notificar(messageText, messageSeverity);
		handleCloseMessage(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openMessage]);

	// Agendamento da defesa (etapa 5 no TCC I, 8 no TCC II): orientador e membros com convite aceito na fase.
	const renderAgendarDefesa = (fase: 1 | 2) => {
		if (!trabalhoConclusao) return null;
		const orientador = conviteExistente?.aceito
			? { codigo: conviteExistente.codigo_docente, nome: conviteExistente.docente?.nome ?? conviteExistente.codigo_docente }
			: null;
		const membros = convitesBanca
			.filter((c) => c.aceito === true && !!c.data_feedback && c.fase === fase)
			.map((c) => ({ codigo: c.codigo_docente, nome: c.docente?.nome ?? c.codigo_docente }));
		return (
			<EtapaAgendarDefesa
				oferta={{ ano: trabalhoConclusao.ano, semestre: trabalhoConclusao.semestre, id_curso: trabalhoConclusao.id_curso, fase }}
				orientador={orientador}
				membros={membros}
				defesas={fase === 1 ? defesasFase1 : defesasFase2}
				selecionado={fase === 1 ? selectedHorarioBancaFase1 : selectedHorarioBancaFase2}
				onSelecionar={fase === 1 ? setSelectedHorarioBancaFase1 : setSelectedHorarioBancaFase2}
			/>
		);
	};

	const renderStepContent = (step: number) => {
		switch (step) {
			case 0:
				return (
					<EtapaEscolherOrientador
						convite={conviteExistente}
						idCurso={trabalhoConclusao?.id_curso ?? ofertaAtual?.id_curso ?? null}
						onConvidar={(codigo) => {
							setOrientadorSugerido(codigo);
							handleOpenConviteModal();
						}}
						onVerConvite={() => {
							setOrientadorSugerido(undefined);
							handleOpenConviteModal();
						}}
					/>
				);
			case 1:
			case 2:
			case 3:
				return (
					<EtapaTemaTituloResumo
						dados={{ tema: formData.tema ?? "", titulo: formData.titulo ?? "", resumo: formData.resumo ?? "" }}
						onChange={(campo, valor) => handleInputChange(campo, valor)}
					/>
				);
			case 4:
				return (
					<EtapaConviteBanca
						fase={1}
						convites={convitesBanca.filter((c) => c.fase === 1)}
						onConvidar={handleOpenConviteBancaModal}
					/>
				);
			case 5: {
				// Etapa 6: Selecionar horário da banca do Projeto (Fase 1)
				if (!trabalhoConclusao) return null;
				if (trabalhoConclusao.fase === 1) return renderAgendarDefesa(1);
				// TCC II: resultado da defesa do projeto (fase 1).
				return <EtapaDefesaResultado fase={1} defesas={defesasFase1} aprovado={Boolean(trabalhoConclusao.aprovado_projeto)} />;
			}
			case 6:
				// Seminário de andamento: só existe no TCC II.
				if (trabalhoConclusao?.fase !== 2) return null;
				return (
					<EtapaSeminario
						texto={formData.seminario_andamento ?? ""}
						onChange={(valor) => handleInputChange("seminario_andamento", valor)}
						projetoAprovado={Boolean(trabalhoConclusao.aprovado_projeto)}
					/>
				);
			case 7:
				// Banca final: só existe no TCC II.
				if (trabalhoConclusao?.fase !== 2) return null;
				return (
					<EtapaConviteBanca
						fase={2}
						convites={convitesBanca.filter((c) => c.fase === 2)}
						bancaProjeto={convitesBanca.filter((c) => c.fase === 1)}
						onConvidar={handleOpenConviteBancaFinalModal}
					/>
				);
			case 8:
				return trabalhoConclusao?.fase === 2 ? renderAgendarDefesa(2) : null;
			default:
				return null;
		}
	};

	if (loading) {
		return <EmptyState icon="hourglass_top" title="Carregando seu TCC…" text="Buscando oferta, convites e defesas." />;
	}

	// TCC aprovado em período anterior: não há jornada a percorrer.
	if (showCompletedMessage && tccAnterior) {
		return <TccConcluido tcc={tccAnterior} />;
	}

	// TCC de período anterior aguardando a escolha (continuar no TCC II ou importar dados).
	if (!trabalhoConclusao) {
		if (tccAnterior && (modalType === "next_phase" || modalType === "import")) {
			return (
				<TccAnterior
					tipo={modalType}
					tcc={tccAnterior}
					ofertaAtual={ofertaAtual}
					aberto={openImportModal}
					onAbrir={reabrirImportacao}
					onFechar={handleImportModalClose}
					onEscolher={(importar) => void handleImportData(importar)}
				/>
			);
		}
		return (
			<EmptyState
				icon="error"
				title="Não foi possível carregar seu TCC"
				text="Verifique se há uma oferta de TCC aberta para o seu curso e recarregue a página. Se o problema continuar, procure a coordenação."
			/>
		);
	}

	const fase = trabalhoConclusao.fase === 2 ? 2 : 1;
	const totalEtapas = getEtapasValidas().length;
	// TCC II sem projeto aprovado: só o seminário (rascunho) fica disponível, qualquer que seja a etapa gravada.
	const aguardandoAprovacao = fase === 2 && !trabalhoConclusao.aprovado_projeto;
	const noFim = activeStep >= totalEtapas || aguardandoAprovacao;

	// Conteúdo depois da última etapa válida: resultado da defesa ou, no TCC II sem projeto aprovado, o seminário.
	const conteudoFinal = () => {
		if (aguardandoAprovacao) {
			return (
				<EtapaSeminario
					texto={formData.seminario_andamento ?? ""}
					onChange={(valor) => handleInputChange("seminario_andamento", valor)}
					projetoAprovado={false}
				/>
			);
		}
		return (
			<EtapaDefesaResultado
				fase={fase}
				defesas={fase === 2 ? defesasFase2 : defesasFase1}
				aprovado={Boolean(fase === 2 ? trabalhoConclusao.aprovado_tcc : trabalhoConclusao.aprovado_projeto)}
			/>
		);
	};

	const acoes = () => {
		const voltar = (
			<BotaoDesign
				variant="secondary"
				onClick={() => {
					if (activeStep >= 1 && activeStep <= 3) {
						// Tema, título e resumo é uma tela só: voltar leva à etapa anterior a ela.
						setActiveStep(0);
						if (onEtapaChange) onEtapaChange(0);
					} else handleBack();
				}}
				// Primeiro passo de cada fase: etapa 0 (TCC I) ou seminário, etapa 6 (TCC II).
				disabled={activeStep === 0 || (fase === 2 && activeStep === 6) || saving}
			>
				Voltar
			</BotaoDesign>
		);

		// Fim da fase: sem avanço. No TCC II sem projeto aprovado, só é possível salvar o seminário.
		if (noFim) {
			if (aguardandoAprovacao) {
				return (
					<div className="jornada-acoes">
						<span />
						<BotaoDesign variant="secondary" icon="save" onClick={() => void salvarRascunho()} disabled={saving}>
							Salvar
						</BotaoDesign>
					</div>
				);
			}
			return (
				<div className="jornada-acoes">
					{voltar}
					<span />
				</div>
			);
		}

		if (activeStep >= 1 && activeStep <= 3) {
			return (
				<div className="jornada-acoes">
					{voltar}
					<div style={{ display: "flex", gap: 8 }}>
						<BotaoDesign variant="secondary" icon="save" onClick={() => void salvarTemaTituloResumo(false)} disabled={saving}>
							Salvar
						</BotaoDesign>
						<BotaoDesign
							onClick={() => void salvarTemaTituloResumo(true)}
							disabled={saving || ![formData.tema, formData.titulo, formData.resumo].every((v) => v && v.trim())}
						>
							{saving ? "Salvando…" : "Continuar"}
						</BotaoDesign>
					</div>
				</div>
			);
		}

		const finalizar = activeStep === totalEtapas - 1 && (fase !== 2 || Boolean(trabalhoConclusao.aprovado_projeto));
		// Etapa de horário ainda sem defesa: o botão final é o que agenda (POST /defesas/agendar).
		const agendar = finalizar && activeStep === (fase === 2 ? 8 : 5) && !temDefesaAgendada(fase);
		const avancar = (
			<BotaoDesign
				onClick={handleNext}
				disabled={saving || !validarEtapaAtual()}
				icon={agendar ? "event_available" : finalizar ? "check" : undefined}
			>
				{saving ? "Salvando…" : agendar ? "Agendar defesa" : finalizar ? "Finalizar" : "Continuar"}
			</BotaoDesign>
		);
		return (
			<div className="jornada-acoes">
				{voltar}
				{activeStep === 6 && fase === 2 ? (
					// Seminário de andamento (TCC II): pode ser salvo como rascunho antes de continuar.
					<div style={{ display: "flex", gap: 8 }}>
						<BotaoDesign variant="secondary" icon="save" onClick={() => void salvarRascunho()} disabled={saving}>
							Salvar
						</BotaoDesign>
						{avancar}
					</div>
				) : (
					avancar
				)}
			</div>
		);
	};

	return (
		<>
			{noFim ? conteudoFinal() : renderStepContent(activeStep)}
			{/* Navegação da jornada: abaixo do conteúdo; no celular, fixa acima da navegação inferior. */}
			{acoes()}

			<ConviteOrientadorModal
				open={openConviteModal}
				onClose={handleCloseConviteModal}
				idTcc={trabalhoConclusao.id}
				idCurso={trabalhoConclusao.id_curso}
				onConviteEnviado={handleConviteEnviado}
				conviteExistente={conviteExistente && (conviteExistente.data_feedback === null || conviteExistente.aceito) ? conviteExistente : null}
				fase={trabalhoConclusao.fase || 1}
				orientadorInicial={orientadorSugerido}
			/>
			<ConviteBancaModal
				open={openConviteBancaModal}
				onClose={handleCloseConviteBancaModal}
				idTcc={trabalhoConclusao.id}
				idCurso={trabalhoConclusao.id_curso}
				onConviteEnviado={handleConviteBancaEnviado}
				convitesExistentes={convitesBanca.filter((c) => c.fase === 1)}
				conviteOrientacao={conviteExistente}
				tipoConvite="banca_projeto"
				docentesPreSelecionados={[]}
			/>
			<ConviteBancaModal
				open={openConviteBancaFinalModal}
				onClose={handleCloseConviteBancaFinalModal}
				idTcc={trabalhoConclusao.id}
				idCurso={trabalhoConclusao.id_curso}
				onConviteEnviado={handleConviteBancaEnviado}
				convitesExistentes={convitesBanca.filter((c) => c.fase === 2)}
				conviteOrientacao={conviteExistente}
				tipoConvite="banca_trabalho"
				// Banca final: os membros que aceitaram a banca do projeto vêm sugeridos.
				docentesPreSelecionados={convitesBanca.filter((c) => c.fase === 1 && c.aceito === true).map((c) => c.codigo_docente)}
			/>
		</>
	);
}
