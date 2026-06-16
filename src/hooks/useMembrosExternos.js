import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
	getMembrosExternosTcc,
	adicionarMembroExterno,
	removerMembroExterno,
	buscarExternosPorNome,
} from "../services/membros-externos-service";
import avaliarDefesasService from "../services/avaliar-defesas-service";

const FORM_VAZIO = {
	nome: "",
	email: "",
	instituicao: "",
	siape: "",
};

export function useMembrosExternos() {
	const { usuario } = useAuth();

	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [orientacoes, setOrientacoes] = useState([]);
	const [tccSelecionado, setTccSelecionado] = useState(null);
	const [membros, setMembros] = useState([]);

	const [modalAberto, setModalAberto] = useState(false);
	const [form, setForm] = useState(FORM_VAZIO);
	const [dataHoraDefesa, setDataHoraDefesa] = useState(null);
	const [formErros, setFormErros] = useState({});

	const [loading, setLoading] = useState(false);
	const [loadingMembros, setLoadingMembros] = useState(false);
	const [salvando, setSalvando] = useState(false);
	const [removendo, setRemovendo] = useState(null);
	const [buscandoNome, setBuscandoNome] = useState(false);
	const [sugestoesNome, setSugestoesNome] = useState([]);
	const [docenteEncontrado, setDocenteEncontrado] = useState(null);
	const debounceRef = useRef(null);

	const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

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
		if (tccSelecionado) {
			carregarMembros(tccSelecionado.id);
		} else {
			setMembros([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tccSelecionado]);

	async function carregarCursos() {
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
			const cursosOrientador = await avaliarDefesasService.getCursosOrientador(codigoDocente);
			const cursosExtraidos = cursosOrientador.map((o) => o.curso);
			setCursos(cursosExtraidos);
			if (cursosExtraidos.length === 1) {
				setCursoSelecionado(cursosExtraidos[0].id);
			}
		} catch {
			setCursos([]);
		}
	}

	async function carregarOrientacoes() {
		setLoading(true);
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
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

	const carregarMembros = useCallback(async (idTcc) => {
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

	function handleFormChange(campo, valor) {
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

	function selecionarSugestao(docente) {
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
		const erros = {};
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

		if (!tccSelecionado) return;

		setSalvando(true);
		try {
			await adicionarMembroExterno({
				id_tcc: tccSelecionado.id,
				fase: tccSelecionado.fase,
				data_hora_defesa: dataHoraDefesa ? dataHoraDefesa.toISOString() : null,
				docente: {
					nome: form.nome.trim(),
					email: form.email.trim(),
					instituicao: form.instituicao.trim(),
					siape: form.siape ? parseInt(form.siape) : null,
				},
			});
			setSnackbar({ open: true, message: "Membro externo adicionado com sucesso!", severity: "success" });
			fecharModal();
			await carregarMembros(tccSelecionado.id);
		} catch (err) {
			setSnackbar({ open: true, message: err.message, severity: "error" });
		} finally {
			setSalvando(false);
		}
	}

	async function handleRemoverMembro(codigoDocente, fase) {
		if (!tccSelecionado) return;
		setRemovendo(codigoDocente);
		try {
			await removerMembroExterno(tccSelecionado.id, codigoDocente, fase);
			setSnackbar({ open: true, message: "Membro externo removido com sucesso.", severity: "success" });
			await carregarMembros(tccSelecionado.id);
		} catch (err) {
			setSnackbar({ open: true, message: err.message, severity: "error" });
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
