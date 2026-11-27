import { useMemo, useState } from "react";

import { useConviteOrientador } from "../../hooks/useConviteOrientador";
import type { Convite } from "../../types/convite";
import { Avatar, Button, Icon, Input, ModalDialog, StatusChip, Textarea } from "../ui";

interface ConviteOrientadorModalProps {
	open: boolean;
	onClose: () => void;
	idTcc: number;
	idCurso: number | string;
	onConviteEnviado?: () => void;
	conviteExistente?: Convite | null;
	fase?: number;
	orientadorInicial?: string;
}

/** convite.mensagem_envio é varchar(255) na API. */
const LIMITE_MENSAGEM = 255;
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Diálogo de convite de orientação no padrão do design. Sem convite: escolha de um docente
 * (já marcado quando vem do catálogo de temas) e mensagem opcional. Com convite pendente ou
 * aceito: só a consulta do convite enviado. As regras continuam no hook useConviteOrientador.
 */
export default function ConviteOrientadorModal({
	open,
	onClose,
	idTcc,
	idCurso,
	onConviteEnviado,
	conviteExistente = null,
	fase = 1,
	orientadorInicial,
}: ConviteOrientadorModalProps) {
	const {
		orientadores,
		orientadorSelecionado,
		setOrientadorSelecionado,
		mensagem,
		setMensagem,
		loading,
		loadingOrientadores,
		error,
		conviteProcessado,
		modoVisualizacao,
		handleEnviarConvite,
		handleClose,
	} = useConviteOrientador({
		open,
		idCurso,
		idTcc,
		conviteExistente,
		fase,
		onConviteEnviado,
		onClose,
		orientadorInicial,
	});

	const [busca, setBusca] = useState("");

	const docentes = useMemo(() => {
		const termo = semAcento(busca.trim());
		return (Array.isArray(orientadores) ? orientadores : [])
			.filter((d) => !termo || semAcento(`${d.nome ?? ""} ${d.codigo}`).includes(termo))
			// o docente escolhido no catálogo aparece primeiro
			.sort(
				(a, b) =>
					Number(b.codigo === orientadorSelecionado) - Number(a.codigo === orientadorSelecionado) ||
					(a.nome ?? a.codigo).localeCompare(b.nome ?? b.codigo, "pt-BR"),
			);
	}, [orientadores, busca, orientadorSelecionado]);

	const fechar = () => {
		setBusca("");
		handleClose();
	};

	if (modoVisualizacao && conviteExistente) {
		const docente =
			conviteExistente.docente ?? (Array.isArray(orientadores) ? orientadores : []).find((d) => d.codigo === conviteExistente.codigo_docente);
		const nome = docente?.nome ?? conviteExistente.codigo_docente;
		const aceito = conviteProcessado?.status === "Aceito";
		return (
			<ModalDialog
				open={open}
				onClose={fechar}
				icon="person_search"
				title="Convite de orientação"
				description={aceito ? "O docente aceitou orientar o seu TCC." : "O convite aguarda a resposta do docente."}
				actions={
					<Button variant="secondary" onClick={fechar}>
						Fechar
					</Button>
				}
			>
				<div className="dialog-form">
					<div className="defense-person">
						<Avatar nome={nome} size="small" />
						<div>
							<strong>{nome}</strong>
							<span>{conviteProcessado?.dataEnvio ? `Enviado em ${conviteProcessado.dataEnvio}` : "Orientador convidado"}</span>
						</div>
						<StatusChip type={aceito ? "success" : "warning"}>{aceito ? "Aceito" : "Pendente"}</StatusChip>
					</div>
					{conviteExistente.mensagem_envio && (
						<div className="orientation-content-preview">
							<div>
								<span>MENSAGEM</span>
								<p>{conviteExistente.mensagem_envio}</p>
							</div>
						</div>
					)}
				</div>
			</ModalDialog>
		);
	}

	return (
		<ModalDialog
			open={open}
			onClose={fechar}
			icon="person_add"
			title="Convidar orientador"
			description="Escolha o docente que você quer como orientador. Ele recebe o convite e responde pelo sistema."
			actions={
				<>
					<Button variant="secondary" onClick={fechar} disabled={loading}>
						Cancelar
					</Button>
					<Button icon="send" onClick={() => void handleEnviarConvite()} disabled={loading || !orientadorSelecionado}>
						{loading ? "Enviando…" : "Enviar convite"}
					</Button>
				</>
			}
		>
			{!idCurso && (
				<div className="readonly-box warning-box">
					<Icon name="warning" />
					<span>Não foi possível identificar o curso. Entre em contato com a coordenação.</span>
				</div>
			)}
			{error && (
				<div className="readonly-box warning-box">
					<Icon name="error" />
					<span>{error}</span>
				</div>
			)}

			<div className="dialog-form">
				<div className="search">
					<Icon name="search" />
					<Input placeholder="Buscar docente" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar docente" />
				</div>
				<div className="docente-lista" role="radiogroup" aria-label="Docentes">
					{loadingOrientadores && <p className="docente-lista-vazia">Carregando docentes…</p>}
					{!loadingOrientadores && docentes.length === 0 && <p className="docente-lista-vazia">Nenhum docente encontrado.</p>}
					{!loadingOrientadores &&
						docentes.map((d) => {
							const marcado = orientadorSelecionado === d.codigo;
							return (
								<label key={d.codigo} className={`docente-opcao ${marcado ? "selected" : ""} ${!idCurso ? "disabled" : ""}`}>
									<input
										type="radio"
										name="orientador"
										checked={marcado}
										disabled={!idCurso}
										onChange={() => setOrientadorSelecionado(d.codigo)}
									/>
									<Avatar nome={d.nome ?? d.codigo} size="small" />
									<span>
										<strong>{d.nome ?? d.codigo}</strong>
										<small>{d.codigo}</small>
									</span>
								</label>
							);
						})}
				</div>
				<label className="textarea-label">
					<span>Mensagem (opcional)</span>
					<Textarea
						rows={3}
						value={mensagem}
						placeholder="Apresente-se e conte a ideia do seu trabalho…"
						onChange={(e) => setMensagem(e.target.value.slice(0, LIMITE_MENSAGEM))}
					/>
					<small>
						{mensagem.length} / {LIMITE_MENSAGEM}
					</small>
				</label>
			</div>
		</ModalDialog>
	);
}
