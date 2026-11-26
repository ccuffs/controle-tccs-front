import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import orientacaoController from "../controllers/orientacao-controller";
import orientacaoService from "./orientacao-service";
import type { FiltrosAcompanhamento, RespostaAcompanhamento } from "../types/acompanhamento";
import type { TrabalhoConclusao } from "../types/trabalho-conclusao";

export async function listarAcompanhamento(filtros: FiltrosAcompanhamento): Promise<RespostaAcompanhamento> {
	const params = new URLSearchParams();
	for (const [chave, valor] of Object.entries(filtros)) {
		if (valor !== undefined && valor !== null && valor !== "") params.set(chave, String(valor));
	}
	try {
		return await axiosInstance.get<RespostaAcompanhamento>(`/orientacoes/acompanhamento?${params.toString()}`);
	} catch (error) {
		throw new Error(getErrorMessage(error, "Erro ao carregar as orientações"));
	}
}

export async function obterTrabalho(idTcc: number): Promise<TrabalhoConclusao> {
	try {
		const resposta = await axiosInstance.get<{ trabalho: TrabalhoConclusao }>(`/trabalho-conclusao/${idTcc}`);
		return resposta.trabalho;
	} catch (error) {
		throw new Error(getErrorMessage(error, "Erro ao carregar o trabalho de conclusão"));
	}
}

interface TrocaOrientador {
	idTcc: number;
	fase: number;
	novoCodigo: string;
	atual: { codigo: string; idOrientacao: number } | null;
}

/**
 * Define ou troca o orientador de um TCC pela coordenação. Mesma sequência do
 * fluxo anterior (useOrientacao.handleSaveEdit): remove a orientação atual, registra
 * um convite de orientação já aceito para o novo docente e cria a nova orientação.
 */
export async function definirOrientador({ idTcc, fase, novoCodigo, atual }: TrocaOrientador): Promise<void> {
	if (atual?.codigo === novoCodigo) return;
	const convites = orientacaoController.filtrarConvitesOrientacao(await orientacaoService.getConvites({ id_tcc: idTcc }), fase);

	if (atual) await orientacaoService.deletarOrientacao(atual.idOrientacao);
	if (!novoCodigo) return;

	if (!atual) {
		const conviteNovo = convites.find((c) => c.codigo_docente === novoCodigo);
		if (!conviteNovo || conviteNovo.aceito === false) {
			await orientacaoService.criarConvite(
				orientacaoController.prepararConviteOrientacao(idTcc, fase, novoCodigo, "Informado pelo professor do CCR", true),
			);
		}
	} else {
		if (convites.some((c) => c.codigo_docente === atual.codigo)) {
			await orientacaoService.deletarConvite(idTcc, atual.codigo, fase);
		}
		await orientacaoService.criarConvite(
			orientacaoController.prepararConviteOrientacao(
				idTcc,
				fase,
				novoCodigo,
				`Alteração de orientação informada pelo professor do CCR de ${atual.codigo} para ${novoCodigo}`,
				true,
			),
		);
	}
	await orientacaoService.criarOrientacao(orientacaoController.prepararOrientacao(novoCodigo, idTcc));
}

const acompanhamentoService = { listarAcompanhamento, obterTrabalho, definirOrientador };
export default acompanhamentoService;
