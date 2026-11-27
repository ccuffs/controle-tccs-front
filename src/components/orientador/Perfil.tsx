import { useEffect, useState } from "react";
import { usePerfilAtual } from "../../hooks/usePerfilAtual";
import disponibilidadeBancaService from "../../services/disponibilidade-banca-service";
import { getMeuPerfil, atualizarDocente } from "../../services/perfil-orientador-service";
import temasTccService from "../../services/temas-tcc-service";
import type { Docente } from "../../types/docente";
import { getErrorMessage } from "../../utils/apiError";
import { Avatar, Button, Card, Input, PageHeader, useNotice } from "../ui";

/**
 * Perfil do docente (imagem meu_perfil_orientador.png). O docente altera apenas SIAPE e sala.
 * No perfil Banca, os cursos listados são os de banca_curso; no Orientador, os de orientadores_curso.
 */
export default function Perfil() {
	const notificar = useNotice();
	const ehBanca = usePerfilAtual() === "banca";
	const [docente, setDocente] = useState<Docente | null>(null);
	const [cursos, setCursos] = useState<string[]>([]);
	const [siape, setSiape] = useState("");
	const [sala, setSala] = useState("");
	const [salvando, setSalvando] = useState(false);

	useEffect(() => {
		getMeuPerfil()
			.then((d) => {
				setDocente(d);
				setSiape(d.siape ? String(d.siape) : "");
				setSala(d.sala ? String(d.sala) : "");
				return ehBanca ? disponibilidadeBancaService.getCursosBanca(d.codigo) : temasTccService.getCursosOrientador(d.codigo);
			})
			.then((lista) => setCursos(lista.map((c) => c.curso?.nome).filter((n): n is string => Boolean(n))))
			.catch((e) => notificar(getErrorMessage(e, "Erro ao carregar o perfil"), "error"));
	}, [notificar, ehBanca]);

	const salvar = async () => {
		if (!docente) return;
		if ([siape, sala].some((v) => v.trim() !== "" && Number.isNaN(Number(v)))) {
			notificar("SIAPE e sala devem ser numéricos.", "error");
			return;
		}
		setSalvando(true);
		try {
			await atualizarDocente({
				codigo: docente.codigo,
				siape: siape.trim() ? Number(siape) : null,
				sala: sala.trim() ? Number(sala) : null,
			});
			notificar("Perfil atualizado com sucesso.");
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar o perfil."), "error");
		} finally {
			setSalvando(false);
		}
	};

	return (
		<>
			<PageHeader title="Meu perfil" description="Consulte e mantenha seus dados pessoais atualizados." />
			<Card className="card profile-card">
				<div className="profile-identity">
					<Avatar nome={docente?.nome ?? docente?.codigo} className="profile-avatar" />
					<div>
						<h2>{docente?.nome ?? "—"}</h2>
						<p>{["Docente", ...cursos].join(" · ")}</p>
					</div>
				</div>
				<div className="form-grid">
					<label>
						<span>Nome completo</span>
						<Input value={docente?.nome ?? ""} readOnly />
					</label>
					<label>
						<span>Código</span>
						<Input value={docente?.codigo ?? ""} readOnly />
					</label>
					<label className="full">
						<span>E-mail</span>
						<Input value={docente?.email ?? ""} readOnly />
					</label>
					<label>
						<span>SIAPE</span>
						<Input value={siape} onChange={(e) => setSiape(e.target.value)} inputMode="numeric" />
					</label>
					<label>
						<span>Sala</span>
						<Input value={sala} onChange={(e) => setSala(e.target.value)} inputMode="numeric" />
					</label>
				</div>
				<div className="profile-actions">
					<Button icon="save" onClick={salvar} disabled={salvando || !docente}>
						Salvar alterações
					</Button>
				</div>
			</Card>
		</>
	);
}
