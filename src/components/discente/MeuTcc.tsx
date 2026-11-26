import { useState } from "react";
import { useModuloDiscente } from "../../hooks/useModuloDiscente";
import { progressoEtapa } from "../../utils/etapas";
import TccStepper, { type ContextoTcc } from "../modulo-dicente/TccStepper";
import { Icon, PlainButton, Surface } from "../ui";

interface Passo {
	rotulo: string;
	/** Etapa do stepper aberta ao clicar no passo. */
	etapa: number;
	etapas: number[];
	/** Passo "Aguardar aceite": mesma etapa 0, ativo enquanto o convite estiver pendente. */
	aguardandoAceite?: boolean;
}

const PASSOS: Record<number, Passo[]> = {
	1: [
		{ rotulo: "Escolher orientador e tema", etapa: 0, etapas: [0] },
		{ rotulo: "Aguardar aceite", etapa: 0, etapas: [0], aguardandoAceite: true },
		{ rotulo: "Tema, título e resumo", etapa: 1, etapas: [1, 2, 3] },
		{ rotulo: "Banca do projeto", etapa: 4, etapas: [4] },
		{ rotulo: "Agendar defesa", etapa: 5, etapas: [5] },
		{ rotulo: "Defesa e resultado", etapa: 6, etapas: [6] },
	],
	2: [
		{ rotulo: "Seminário de andamento", etapa: 6, etapas: [6] },
		{ rotulo: "Banca final", etapa: 7, etapas: [7] },
		{ rotulo: "Agendar defesa final", etapa: 8, etapas: [8] },
		{ rotulo: "Defesa e resultado", etapa: 9, etapas: [9] },
	],
};

/** "Meu TCC" do discente: oferta, jornada por etapas e o conteúdo do stepper existente. */
export default function MeuTcc() {
	const { etapaAtual, setEtapaAtual, loading } = useModuloDiscente();
	const [contexto, setContexto] = useState<ContextoTcc | null>(null);

	const fase = contexto?.fase ?? 1;
	const passos = PASSOS[fase] ?? PASSOS[1] ?? [];
	const etapaSalva = contexto?.etapaSalva ?? etapaAtual;
	const indiceAtivo = (() => {
		const i = passos.findIndex((p) =>
			p.etapas.includes(etapaAtual) && (p.etapas[0] !== 0 || Boolean(p.aguardandoAceite) === Boolean(contexto?.convitePendente)),
		);
		return i >= 0 ? i : passos.findIndex((p) => p.etapas.includes(etapaAtual));
	})();
	const liberado = (p: Passo) => p.etapa <= Math.max(etapaSalva, etapaAtual);
	const progresso = progressoEtapa(fase, etapaSalva, contexto?.aprovado ?? false);

	return (
		<>
			<Surface className="student-offer card">
				<div>
					<span>MINHA OFERTA ATUAL</span>
					<h1>{fase === 2 ? "TCC (TCC II)" : "Projeto (TCC I)"}</h1>
					<p>
						{[contexto?.curso, contexto?.ano ? `${contexto.ano}/${contexto.semestre}` : null].filter(Boolean).join(" · ") ||
							"Carregando oferta…"}
					</p>
				</div>
				<div className="overall-progress">
					<div>
						<span>Progresso geral</span>
						<strong>{progresso}%</strong>
					</div>
					<div>
						<i style={{ width: `${progresso}%` }} />
					</div>
				</div>
			</Surface>
			<div className="journey-layout">
				<Surface component="aside" className="card journey-steps">
					{passos.map((p, i) => {
						const estado = i < indiceAtivo ? "done" : i === indiceAtivo ? "active" : liberado(p) ? "" : "locked";
						return (
							<PlainButton
								key={p.rotulo}
								className={estado}
								onClick={() => liberado(p) && setEtapaAtual(p.etapa)}
								disabled={!liberado(p)}
								aria-current={i === indiceAtivo ? "step" : undefined}
							>
								<span>{i < indiceAtivo ? <Icon name="check" size={16} /> : i + 1}</span>
								<div>
									<small>ETAPA {i + 1}</small>
									<strong>{p.rotulo}</strong>
									{estado === "locked" && (
										<em>
											<Icon name="lock" size={13} />
											Conclua a etapa anterior
										</em>
									)}
								</div>
							</PlainButton>
						);
					})}
				</Surface>
				<Surface component="section" className="card journey-content">
					{loading ? (
						<p>Carregando…</p>
					) : (
						<TccStepper etapaInicial={etapaAtual} onEtapaChange={setEtapaAtual} modoJornada onContexto={setContexto} />
					)}
				</Surface>
			</div>
		</>
	);
}
