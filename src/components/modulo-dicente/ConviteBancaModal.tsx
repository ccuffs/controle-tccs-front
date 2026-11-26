import { useMemo, useState } from "react";

import { useConviteBanca } from "../../hooks/useConviteBanca";
import type { Convite } from "../../types/convite";
import { Avatar, Button, Icon, Input, ModalDialog, Textarea } from "../ui";

interface ConviteBancaModalProps {
	open: boolean;
	onClose: () => void;
	idTcc: number;
	idCurso: number | string;
	onConviteEnviado?: () => void;
	convitesExistentes?: Convite[];
	conviteOrientacao?: Convite | null;
	tipoConvite?: string;
	docentesPreSelecionados?: string[];
}

/** convite.mensagem_envio é varchar(255) na API. */
const LIMITE_MENSAGEM = 255;
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Diálogo de convite de banca no padrão do design. As regras (limite de 2 convites
 * simultâneos, pré-seleção da banca do projeto na banca final, docentes indisponíveis)
 * continuam no hook useConviteBanca.
 */
export default function ConviteBancaModal({
	open,
	onClose,
	idTcc,
	idCurso,
	onConviteEnviado,
	convitesExistentes = [],
	conviteOrientacao = null,
	tipoConvite = "banca_projeto",
	docentesPreSelecionados = [],
}: ConviteBancaModalProps) {
	const {
		docentesBanca,
		orientadoresSelecionados,
		mensagem,
		setMensagem,
		convitesPendentes,
		convitesAceitos,
		loading,
		loadingDocentesBanca,
		error,
		podeEnviarMaisConvites,
		handleEnviarConvites,
		handleClose,
		handleChangeOrientadores,
		isDocenteDisabled,
		getDocenteSecondaryText,
		mensagemNaoPodeEnviar,
	} = useConviteBanca({
		open,
		idCurso,
		idTcc,
		convitesExistentes,
		conviteOrientacao,
		tipoConvite,
		docentesPreSelecionados,
		onConviteEnviado,
		onClose,
	});

	const [busca, setBusca] = useState("");
	const limite = 2 - convitesAceitos.length - convitesPendentes.length;

	const docentes = useMemo(() => {
		const termo = semAcento(busca.trim());
		return (Array.isArray(docentesBanca) ? docentesBanca : [])
			.filter((d) => !termo || semAcento(`${d.nome ?? ""} ${d.codigo}`).includes(termo))
			.sort((a, b) => (a.nome ?? a.codigo).localeCompare(b.nome ?? b.codigo, "pt-BR"));
	}, [docentesBanca, busca]);

	const alternar = (codigo: string) => {
		const atual = orientadoresSelecionados;
		handleChangeOrientadores({
			target: { value: atual.includes(codigo) ? atual.filter((c) => c !== codigo) : [...atual, codigo] },
		});
	};

	const fechar = () => {
		setBusca("");
		handleClose();
	};

	const final = tipoConvite !== "banca_projeto";

	return (
		<ModalDialog
			open={open}
			onClose={fechar}
			icon="groups"
			title={final ? "Convidar banca final" : "Convidar banca do projeto"}
			description={
				podeEnviarMaisConvites
					? `Selecione ${limite === 1 ? "1 docente" : `até ${limite} docentes`}. ${
							final && docentesPreSelecionados.length > 0 && convitesExistentes.length === 0
								? "Os membros da banca do projeto vêm sugeridos."
								: "Cada docente recebe o convite e responde separadamente."
						}`
					: undefined
			}
			actions={
				<>
					<Button variant="secondary" onClick={fechar} disabled={loading}>
						{podeEnviarMaisConvites ? "Cancelar" : "Fechar"}
					</Button>
					{podeEnviarMaisConvites && (
						<Button icon="send" onClick={() => void handleEnviarConvites()} disabled={loading || orientadoresSelecionados.length === 0}>
							{loading
								? "Enviando…"
								: orientadoresSelecionados.length > 1
									? `Enviar ${orientadoresSelecionados.length} convites`
									: "Enviar convite"}
						</Button>
					)}
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

			{podeEnviarMaisConvites ? (
				<div className="dialog-form">
					<div className="search">
						<Icon name="search" />
						<Input placeholder="Buscar docente" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar docente" />
					</div>
					<div className="docente-lista" role="group" aria-label="Docentes">
						{loadingDocentesBanca && <p className="docente-lista-vazia">Carregando docentes…</p>}
						{!loadingDocentesBanca && docentes.length === 0 && <p className="docente-lista-vazia">Nenhum docente encontrado.</p>}
						{!loadingDocentesBanca &&
							docentes.map((d) => {
								const marcado = orientadoresSelecionados.includes(d.codigo);
								const indisponivel = isDocenteDisabled(d) || (!marcado && orientadoresSelecionados.length >= limite);
								const obs = getDocenteSecondaryText(d);
								return (
									<label
										key={d.codigo}
										className={`docente-opcao ${marcado ? "selected" : ""} ${indisponivel ? "disabled" : ""}`}
									>
										<input type="checkbox" checked={marcado} disabled={indisponivel} onChange={() => alternar(d.codigo)} />
										<Avatar nome={d.nome ?? d.codigo} size="small" />
										<span>
											<strong>{d.nome ?? d.codigo}</strong>
											<small>{obs || (d.externo ? `Externo${d.instituicao ? ` · ${d.instituicao}` : ""}` : d.codigo)}</small>
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
							placeholder="Escreva uma mensagem para os membros da banca…"
							onChange={(e) => setMensagem(e.target.value.slice(0, LIMITE_MENSAGEM))}
						/>
						<small>
							{mensagem.length} / {LIMITE_MENSAGEM}
						</small>
					</label>
				</div>
			) : (
				<div className="readonly-box">
					<Icon name="info" />
					<span>{mensagemNaoPodeEnviar}</span>
				</div>
			)}
		</ModalDialog>
	);
}
