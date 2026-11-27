import { useEffect, useMemo, useState } from "react";
import { contemBusca } from "../../hooks/useListaLocal";
import temasTccService from "../../services/temas-tcc-service";
import type { TemaTcc } from "../../types/tema-tcc";
import { getErrorMessage } from "../../utils/apiError";
import { Avatar, Button, Card, EmptyState, Icon, Input, Select, StatusChip, Surface, useNotice, Realce } from "../ui";

const TODOS = "__todos__";

interface CatalogoTemasProps {
	idCurso: number | null;
	/** Desabilita "Convidar" (ex.: já existe convite de orientação ativo). */
	bloqueado?: boolean;
	onConvidar: (codigoDocente: string) => void;
}

/**
 * Catálogo de temas ativos do curso com busca, filtros e "Convidar este orientador".
 * Usado na tela Temas disponíveis e na etapa "Escolher orientador e tema" do Meu TCC.
 */
export default function CatalogoTemas({ idCurso, bloqueado = false, onConvidar }: CatalogoTemasProps) {
	const notificar = useNotice();
	const [temas, setTemas] = useState<TemaTcc[]>([]);
	const [carregando, setCarregando] = useState(true);
	const [busca, setBusca] = useState("");
	const [area, setArea] = useState(TODOS);
	const [docente, setDocente] = useState(TODOS);

	useEffect(() => {
		if (!idCurso) {
			setCarregando(false);
			return;
		}
		let ativo = true;
		setCarregando(true);
		temasTccService
			.getTemasPorCurso(idCurso)
			.then((lista) => ativo && setTemas(lista.filter((t) => t.ativo)))
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar os temas"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [idCurso, notificar]);

	const areas = useMemo(() => [...new Set(temas.map((t) => t.areaTcc?.descricao).filter((a): a is string => Boolean(a)))].sort(), [temas]);
	const docentes = useMemo(
		() => [...new Map(temas.map((t) => [t.codigo_docente, t.docente?.nome ?? t.codigo_docente])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
		[temas],
	);
	const visiveis = temas.filter(
		(t) =>
			contemBusca(busca, t.descricao, t.areaTcc?.descricao, t.docente?.nome) &&
			(area === TODOS || t.areaTcc?.descricao === area) &&
			(docente === TODOS || t.codigo_docente === docente),
	);

	return (
		<>
			<Surface className="catalog-tools card">
				<div className="search">
					<Icon name="search" />
					<Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por tema, área ou docente" />
				</div>
				<Select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área">
					<option value={TODOS}>Todas as áreas</option>
					{areas.map((a) => (
						<option key={a} value={a}>
							{a}
						</option>
					))}
				</Select>
				<Select value={docente} onChange={(e) => setDocente(e.target.value)} aria-label="Docente">
					<option value={TODOS}>Todos os docentes</option>
					{docentes.map(([codigo, nome]) => (
						<option key={codigo} value={codigo}>
							{nome}
						</option>
					))}
				</Select>
			</Surface>
			<div className="theme-grid">
				{visiveis.map((t) => {
					const livres = Math.max((t.vagasOferta ?? 0) - (t.vagasOcupadas ?? 0), 0);
					return (
						<Card className="card theme-card" key={t.id}>
							<div className="person-line">
								<Avatar nome={t.docente?.nome ?? t.codigo_docente} />
								<div>
									<strong>
										<Realce texto={t.docente?.nome ?? t.codigo_docente} busca={busca} />
									</strong>
									<span>
										<Icon name="school" size={14} /> Docente UFFS
									</span>
								</div>
							</div>
							<div className="theme-area">
								<span>ÁREA DO TCC</span>
								<StatusChip type="info">
									<Realce texto={t.areaTcc?.descricao ?? "—"} busca={busca} />
								</StatusChip>
							</div>
							<h2>
								<Realce texto={t.descricao} busca={busca} />
							</h2>
							<div className="vacancy">
								<span>
									<Icon name="group" size={17} />
									{livres} {livres === 1 ? "vaga" : "vagas"}
								</span>
								<span className={livres === 1 ? "last-vacancy" : ""}>
									{livres === 0 ? "Sem vagas" : livres === 1 ? "Última vaga" : "Disponível"}
								</span>
							</div>
							{/* Como na tela anterior, a falta de vagas é informada mas não impede o convite. */}
							<Button variant="secondary" onClick={() => onConvidar(t.codigo_docente)} disabled={bloqueado}>
								Convidar este orientador
							</Button>
						</Card>
					);
				})}
			</div>
			{!carregando && visiveis.length === 0 && (
				<Surface className="card">
					<EmptyState
						icon="menu_book"
						title={idCurso ? "Nenhum tema encontrado" : "Você não tem TCC na oferta atual"}
						text={idCurso ? "Tente outra busca ou limpe os filtros." : "Os temas aparecem quando você estiver matriculado em uma oferta de TCC."}
					/>
				</Surface>
			)}
		</>
	);
}
