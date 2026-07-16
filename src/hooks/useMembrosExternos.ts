import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
	getMembrosExternosTcc,
	adicionarMembroExterno,
	removerMembroExterno,
	buscarExternosPorNome,
} from "../services/membros-externos-service";
import avaliarDefesasService from "../services/avaliar-defesas-service";
import type { Docente } from "../types/docente";
import type { Orientacao } from "../types/trabalho-conclusao";

interface FormExterno {
	nome: string;
	email: string;
	instituicao: string;
	siape: string;
}

const FORM_VAZIO: FormExterno = {
	nome: "",
	email: "",
	instituicao: "",
	siape: "",
};

export function useMembrosExternos() {
	const { usuario } = useAuth();

	const [cursos, setCursos] = useState<unknown[]>([]);
	const [cursoSelecionado, setCursoSelecionado] = useState<string | number>("");
	const [orientacoes, setOrientacoes] = useState<Orientacao[]>([]);
	const [tccSelecionado, setTccSelecionado] = useState<Orientacao["trabalhoConclusao"] | null>(
		null,
	);
	const [membros, setMembros] = useState<Docente[]>([]);

	const [modalAberto, setModalAberto] = useState(false);
	const [form, setForm] = useState<FormExterno>(FORM_VAZIO);
	const [dataHoraDefesa, setDataHoraDefesa] = useState<Date | null>(null);
	const [formErros, setFormErros] = useState<Record<string, string | undefined>>(
		{},
	);

	const [loading, setLoading] = useState(false);
	const [loadingMembros, setLoadingMembros] = useState(false);
	const [salvando, setSalvando] = useState(false);
	const [removendo, setRemovendo] = useState<string | null>(null);
	const [buscandoNome, setBuscandoNome] = useState(false);
	const [sugestoesNome, setSugestoesNome] = useState<Docente[]>([]);
	const [docenteEncontrado, setDocenteEncontrado] = useState<Docente | null>(
		null,
	);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	}>({ open: false, message: "", severity: "success" });

	useEffect(() => {
		carregarCursos();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (cursoSelecionado) {
			carregarOrientacoes();
		} else {
			setOrientacoes([]);
			setTccSelecionado(null);
			setMembros([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cursoSelecionado]);

	useEffect(() => {
		if (tccSelecionado?.id) {
			carregarMembros(tccSelecionado.id);
		} else {
			setMembros([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tccSelecionado]);

	async function carregarCursos() {
		try {
			const codigoDocente = usuario?.id;
			if (!codigoDocente) {
				setCursos([]);
				return;
			}
			const cursosOrientador = await avaliarDefesasService.getCursosOrientador(codigoDocente);
			const cursosExtraidos = cursosOrientador.map((o) => o.curso);
			setCursos(cursosExtraidos);
			if (cursosExtraidos.length === 1) {
				setCursoSelecionado(cursosExtraidos[0]?.id ?? "");
			}
		} catch {
			setCursos([]);
		}
	}

	async function carregarOrientacoes() {
		setLoading(true);
		try {
			const codigoDocente = usuario?.id;
			if (!codigoDocente) {
				setOrientacoes([]);
				return;
			}
			const resp = await avaliarDefesasService.getOrientacoes({
				codigo_docente: codigoDocente,
				orientador: true,
				id_curso: cursoSelecionado,
			});
			setOrientacoes(resp);
		} catch {
			setOrientacoes([]);
		} finally {
			setLoading(false);
		}
	}

	const carregarMembros = useCallback(async (idTcc: number) => {
		setLoadingMembros(true);
		try {
			const lista = await getMembrosExternosTcc(idTcc);
			setMembros(lista);
		} catch {
			setMembros([]);
		} finally {
			setLoadingMembros(false);
		}
	}, []);

	function abrirModal() {
		setForm(FORM_VAZIO);
		setDataHoraDefesa(null);
		setFormErros({});
		setDocenteEncontrado(null);
		setSugestoesNome([]);
		setModalAberto(true);
	}

	function fecharModal() {
		setModalAberto(false);
	}

	function handleFormChange(campo: keyof FormExterno, valor: string) {
		setForm((prev) => ({ ...prev, [campo]: valor }));
		if (formErros[campo]) {
			setFormErros((prev) => ({ ...prev, [campo]: undefined }));
		}

		// Ao editar o nome manualmente, limpar seleção anterior e buscar sugestões
		if (campo === "nome") {
			setDocenteEncontrado(null);
			setSugestoesNome([]);
			if (debounceRef.current) clearTimeout(debounceRef.current);

			if (valor.trim().length < 2) return;

			debounceRef.current = setTimeout(async () => {
				setBuscandoNome(true);
				try {
					const lista = await buscarExternosPorNome(valor.trim());
					setSugestoesNome(lista);
				} finally {
					setBuscandoNome(false);
				}
			}, 400);
		}
	}

	function selecionarSugestao(docente: Docente) {
		setDocenteEncontrado(docente);
		setSugestoesNome([]);
		setForm({
			nome: docente.nome || "",
			email: docente.email || "",
			instituicao: docente.instituicao || "",
			siape: docente.siape ? String(docente.siape) : "",
		});
	}

	function limparSelecao() {
		setDocenteEncontrado(null);
		setSugestoesNome([]);
		setForm(FORM_VAZIO);
	}

	function validarForm() {
		const erros: Record<string, string> = {};
		if (!form.nome.trim()) erros.nome = "Nome é obrigatório";
		if (!form.email.trim()) erros.email = "E-mail é obrigatório";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) erros.email = "E-mail inválido";
		if (!form.instituicao.trim()) erros.instituicao = "Instituição é obrigatória";
		return erros;
	}

	async function salvarMembroExterno() {
		const erros = validarForm();
		if (Object.keys(erros).length > 0) {
			setFormErros(erros);
			return;
		}

		if (!tccSelecionado?.id) return;

		setSalvando(true);
		try {
			await adicionarMembroExterno({
				id_tcc: tccSelecionado.id,
				fase: tccSelecionado.fase,
				data_hora_defesa: dataHoraDefesa ? dataHoraDefesa.toISOString() : "",
				docente: {
					nome: form.nome.trim(),
					email: form.email.trim(),
					instituicao: form.instituicao.trim(),
					siape: form.siape ? parseInt(form.siape) : undefined,
				},
			});
			setSnackbar({ open: true, message: "Membro externo adicionado com sucesso!", severity: "success" });
			fecharModal();
			await carregarMembros(tccSelecionado.id);
		} catch (err) {
			setSnackbar({
				open: true,
				message: err instanceof Error ? err.message : "",
				severity: "error",
			});
		} finally {
			setSalvando(false);
		}
	}

	async function handleRemoverMembro(codigoDocente: string, fase: number) {
		if (!tccSelecionado?.id) return;
		setRemovendo(codigoDocente);
		try {
			await removerMembroExterno(tccSelecionado.id, codigoDocente, fase);
			setSnackbar({ open: true, message: "Membro externo removido com sucesso.", severity: "success" });
			await carregarMembros(tccSelecionado.id);
		} catch (err) {
			setSnackbar({
				open: true,
				message: err instanceof Error ? err.message : "",
				severity: "error",
			});
		} finally {
			setRemovendo(null);
		}
	}

	function handleCloseSnackbar() {
		setSnackbar((prev) => ({ ...prev, open: false }));
	}

	return {
		buscandoNome,
		sugestoesNome,
		docenteEncontrado,
		selecionarSugestao,
		limparSelecao,
		cursos,
		cursoSelecionado,
		setCursoSelecionado,
		orientacoes,
		tccSelecionado,
		setTccSelecionado,
		membros,
		modalAberto,
		abrirModal,
		fecharModal,
		form,
		handleFormChange,
		formErros,
		dataHoraDefesa,
		setDataHoraDefesa,
		salvando,
		removendo,
		loading,
		loadingMembros,
		snackbar,
		handleCloseSnackbar,
		salvarMembroExterno,
		handleRemoverMembro,
	};
}
