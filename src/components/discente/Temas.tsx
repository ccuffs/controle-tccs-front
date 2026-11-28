import { useEffect, useState } from "react";
import { rotuloPeriodo } from "../../contexts/PeriodoContext";
import { useTccDiscente } from "../../hooks/useTccDiscente";
import orientacaoService from "../../services/orientacao-service";
import type { Convite } from "../../types/convite";
import { getErrorMessage } from "../../utils/apiError";
import ConviteOrientadorModal from "../modulo-dicente/ConviteOrientadorModal";
import { Icon, PageHeader, Surface, useNotice } from "../ui";
import CatalogoTemas from "./CatalogoTemas";

/** Catálogo de temas do curso do discente (protótipo: Catalog em design/App.tsx). */
export default function TemasDisponiveis() {
	const notificar = useNotice();
	const { tcc, recarregar, consulta } = useTccDiscente();
	const [convites, setConvites] = useState<Convite[]>([]);
	const [convidar, setConvidar] = useState<string | null>(null);

	useEffect(() => {
		if (!tcc) return;
		let ativo = true;
		orientacaoService
			.getConvites({ id_tcc: tcc.id })
			.then((listaConvites) => {
				if (ativo) setConvites(listaConvites);
			})
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar os temas"), "error"));
		return () => {
			ativo = false;
		};
	}, [tcc, notificar]);

	const conviteOrientacao = convites.find((c) => c.orientacao && Number(c.fase) === Number(tcc?.fase) && !(c.data_feedback && !c.aceito)) ?? null;

	return (
		<>
			<PageHeader
				eyebrow={tcc ? (tcc.fase === 2 ? "TCC (TCC II)" : "PROJETO (TCC I)") : undefined}
				title="Escolha um tema"
				description="Encontre uma área de interesse e convide o docente para sua orientação."
			/>
			{consulta && (
				<div className="inline-banner" role="status" style={{ margin: "0 0 16px", alignItems: "center" }}>
					<Icon name="visibility" size={18} />
					<span>
						Você está consultando {rotuloPeriodo(consulta)}: as vagas mostradas são desse período e os convites só podem ser enviados no
						período atual.
					</span>
				</div>
			)}
			{conviteOrientacao && (
				<Surface className="card" style={{ padding: 14, marginBottom: 14 }}>
					<span className="meta-line" style={{ marginTop: 0 }}>
						<Icon name={conviteOrientacao.aceito ? "check_circle" : "hourglass_top"} size={16} />
						{conviteOrientacao.aceito
							? `Seu orientador: ${conviteOrientacao.docente?.nome ?? conviteOrientacao.codigo_docente}.`
							: `Convite enviado para ${conviteOrientacao.docente?.nome ?? conviteOrientacao.codigo_docente}, aguardando resposta.`}
					</span>
				</Surface>
			)}
			<CatalogoTemas idCurso={tcc?.id_curso ?? null} bloqueado={Boolean(conviteOrientacao) || !tcc || Boolean(consulta)} onConvidar={setConvidar} />
			{tcc && (
				<ConviteOrientadorModal
					open={Boolean(convidar)}
					onClose={() => setConvidar(null)}
					idTcc={tcc.id}
					idCurso={tcc.id_curso}
					fase={tcc.fase}
					orientadorInicial={convidar ?? undefined}
					onConviteEnviado={() => {
						setConvidar(null);
						notificar("Convite enviado.");
						recarregar();
					}}
				/>
			)}
		</>
	);
}
