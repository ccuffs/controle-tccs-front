import { useRef, useState, type DragEvent } from "react";
import { Alert } from "@mui/material";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { nomeCurso, useCursosCoordenacao } from "../../hooks/useCursosCoordenacao";
import orientacaoService, { type UploadPdfResponse } from "../../services/orientacao-service";
import { getErrorMessage } from "../../utils/apiError";
import { Button, Card, Icon, PageHeader, Select, StatusChip, useNotice } from "../ui";

const PASSOS = ["Dados da oferta", "Enviar PDF", "Revisar resultado"];
const TAMANHO_MAXIMO = 10 * 1024 * 1024;

const STATUS: Record<string, { rotulo: string; tom: "success" | "info" | "neutral" | "danger" }> = {
	dicente_e_tcc_inseridos: { rotulo: "Discente e TCC cadastrados", tom: "success" },
	dicente_e_tcc_inseridos_com_usuario: { rotulo: "Discente, usuário e TCC cadastrados", tom: "success" },
	tcc_inserido: { rotulo: "TCC cadastrado (discente já existia)", tom: "success" },
	dicente_inserido: { rotulo: "Discente cadastrado", tom: "info" },
	dicente_inserido_com_usuario: { rotulo: "Discente e usuário cadastrados", tom: "info" },
	dicente_ja_existe: { rotulo: "Discente já cadastrado", tom: "neutral" },
};

function rotuloStatus(status: string) {
	if (STATUS[status]) return STATUS[status];
	if (status.includes("erro")) return { rotulo: "Erro ao cadastrar", tom: "danger" as const };
	if (status.includes("ja_existe")) return { rotulo: "Já existia", tom: "neutral" as const };
	return { rotulo: status.replace(/_/g, " "), tom: "info" as const };
}

/** Importação de turma a partir do PDF acadêmico (imagem importar_listas_coordenador.png). */
export default function ImportarLista() {
	const notificar = useNotice();
	const { periodos, selecionado } = usePeriodo();
	const { cursos, padrao } = useCursosCoordenacao();
	const entrada = useRef<HTMLInputElement>(null);

	const [passo, setPasso] = useState(0);
	const [curso, setCurso] = useState<string | null>(null);
	const [periodo, setPeriodo] = useState<string | null>(null);
	const [fase, setFase] = useState("1");
	const [arquivo, setArquivo] = useState<File | null>(null);
	const [arrastando, setArrastando] = useState(false);
	const [enviando, setEnviando] = useState(false);
	const [resultado, setResultado] = useState<UploadPdfResponse | null>(null);

	const cursoEfetivo = curso ?? (padrao || (cursos[0] ? String(cursos[0].id) : ""));
	const periodoEfetivo = periodo ?? (selecionado ? `${selecionado.ano}-${selecionado.semestre}` : "");
	const [ano, semestre] = periodoEfetivo.split("-");

	const escolherArquivo = (f: File | undefined) => {
		if (!f) return;
		if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
			notificar("Selecione um arquivo PDF.", "error");
			return;
		}
		if (f.size > TAMANHO_MAXIMO) {
			notificar("O PDF deve ter até 10 MB.", "error");
			return;
		}
		setArquivo(f);
	};

	const soltar = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setArrastando(false);
		escolherArquivo(e.dataTransfer.files[0]);
	};

	const enviar = async () => {
		if (!arquivo || !cursoEfetivo || !ano || !semestre) return;
		const dados = new FormData();
		dados.append("pdf", arquivo);
		dados.append("ano", ano);
		dados.append("semestre", semestre);
		dados.append("fase", fase);
		dados.append("id_curso", cursoEfetivo);
		setEnviando(true);
		try {
			setResultado(await orientacaoService.uploadPdfDicentes(dados));
			setPasso(2);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível processar o PDF."), "error");
		} finally {
			setEnviando(false);
		}
	};

	const reiniciar = () => {
		setArquivo(null);
		setResultado(null);
		setPasso(0);
	};

	const avancar = () => {
		if (passo === 0) setPasso(1);
		else if (passo === 1) void enviar();
		else reiniciar();
	};

	const cursoAtual = cursos.find((c) => String(c.id) === cursoEfetivo);

	return (
		<>
			<PageHeader title="Importar lista de discentes" description="Cadastre uma turma a partir do PDF acadêmico." />
			{/* Marcação própria: as regras .stepper do design não se aplicam ao DOM do Stepper do MUI. */}
			<div className="stepper horizontal" aria-label="Etapas da importação">
				{PASSOS.map((rotulo, i) => (
					<div key={rotulo} className={i < passo ? "done" : i === passo ? "active" : ""} aria-current={i === passo ? "step" : undefined}>
						<span>{i < passo ? <Icon name="check" size={16} /> : i + 1}</span>
						<strong>{rotulo}</strong>
					</div>
				))}
			</div>
			<Card className="card wizard-card">
				{passo === 0 && (
					<>
						<div className="form-heading">
							<h2>Dados da oferta</h2>
							<p>Informe onde os discentes serão cadastrados.</p>
						</div>
						<div className="form-grid">
							<label>
								<span>Curso</span>
								<Select value={cursoEfetivo} onChange={(e) => setCurso(e.target.value)}>
									{cursos.map((c) => (
										<option key={c.id} value={String(c.id)}>
											{nomeCurso(c)}
										</option>
									))}
								</Select>
							</label>
							<label>
								<span>Ano</span>
								<Select
									value={ano ?? ""}
									onChange={(e) => {
										const existe = periodos.some((p) => String(p.ano) === e.target.value && String(p.semestre) === semestre);
										const primeiro = periodos.find((p) => String(p.ano) === e.target.value)?.semestre ?? 1;
										setPeriodo(`${e.target.value}-${existe ? semestre : primeiro}`);
									}}
								>
									{[...new Set(periodos.map((p) => p.ano))].map((a) => (
										<option key={a} value={String(a)}>
											{a}
										</option>
									))}
								</Select>
							</label>
							<label>
								<span>Semestre</span>
								<Select value={semestre ?? ""} onChange={(e) => setPeriodo(`${ano}-${e.target.value}`)}>
									{periodos
										.filter((p) => String(p.ano) === ano)
										.map((p) => (
											<option key={p.semestre} value={String(p.semestre)}>
												{`${p.semestre}º semestre`}
											</option>
										))}
								</Select>
							</label>
							<label>
								<span>Fase</span>
								<Select value={fase} onChange={(e) => setFase(e.target.value)}>
									<option value="1">Projeto (TCC I)</option>
									<option value="2">TCC (TCC II)</option>
								</Select>
							</label>
						</div>
					</>
				)}

				{passo === 1 && (
					<>
						<div className="form-heading">
							<h2>Envie o arquivo da turma</h2>
							<p>O PDF deve conter NOME + MATRÍCULA em cada registro.</p>
						</div>
						<div
							className="dropzone"
							style={arrastando ? { borderColor: "var(--teal-600)" } : undefined}
							onDragOver={(e) => {
								e.preventDefault();
								setArrastando(true);
							}}
							onDragLeave={() => setArrastando(false)}
							onDrop={soltar}
						>
							<Icon name={arquivo ? "task" : "upload_file"} size={40} />
							<h3>{arquivo ? arquivo.name : "Arraste o PDF aqui"}</h3>
							<p>
								{arquivo
									? `${(arquivo.size / 1024).toFixed(0)} KB · ${cursoAtual ? nomeCurso(cursoAtual) : ""} · ${ano}/${semestre} · ${fase === "2" ? "TCC II" : "TCC I"}`
									: "ou selecione um arquivo do seu dispositivo"}
							</p>
							<Button variant="secondary" onClick={() => entrada.current?.click()}>
								{arquivo ? "Trocar PDF" : "Selecionar PDF"}
							</Button>
							<small>PDF de até 10 MB</small>
							<input
								ref={entrada}
								type="file"
								accept="application/pdf,.pdf"
								hidden
								onChange={(e) => {
									escolherArquivo(e.target.files?.[0]);
									e.target.value = "";
								}}
							/>
						</div>
					</>
				)}

				{passo === 2 && resultado && (
					<>
						<div className="form-heading">
							<h2>Importação concluída</h2>
							<p>Revise os registros processados.</p>
						</div>
						<div className="result-kpis">
							<div>
								<span>Total</span>
								<strong>{resultado.totalEncontrados}</strong>
							</div>
							<div className="success-text">
								<span>Sucesso</span>
								<strong>{resultado.sucessos}</strong>
							</div>
							<div className="danger-text">
								<span>Com erro</span>
								<strong>{resultado.erros}</strong>
							</div>
						</div>
						{resultado.erros > 0 && (
							<Alert severity="info" className="inline-banner">
								{resultado.erros} {resultado.erros === 1 ? "registro precisa" : "registros precisam"} de correção manual.
							</Alert>
						)}
						<div className="attention-detail-list">
							{resultado.detalhes.map((d) => {
								const st = rotuloStatus(d.status);
								return (
									<div className="attention-detail-row" key={`${d.matricula}-${d.status}`}>
										<div>
											<strong>{d.nome}</strong>
											<span className="mono">{d.matricula}</span>
										</div>
										<StatusChip type={st.tom}>{st.rotulo}</StatusChip>
									</div>
								);
							})}
						</div>
					</>
				)}

				<div className="wizard-actions">
					{passo < 2 && (
						<Button variant="secondary" onClick={() => setPasso((p) => Math.max(0, p - 1))} disabled={passo === 0 || enviando}>
							Voltar
						</Button>
					)}
					<Button onClick={avancar} disabled={enviando || (passo === 1 && !arquivo) || (passo === 0 && (!cursoEfetivo || !ano))}>
						{passo === 0 ? "Continuar" : passo === 1 ? (enviando ? "Processando…" : "Importar") : "Nova importação"}
					</Button>
				</div>
			</Card>
		</>
	);
}
