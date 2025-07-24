import React, { useState, useEffect } from "react";

import {
    Alert,
    Box,
    Button,
    Snackbar,
    Stack,
    Select,
    FormControl,
    InputLabel,
    Typography,
    Paper,
    CircularProgress,
    MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SaveIcon from '@mui/icons-material/Save';

export default function Orientacao() {
    const [dicentes, setDicentes] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [orientadoresCurso, setOrientadoresCurso] = useState([]);
    const [ofertasTcc, setOfertasTcc] = useState([]);
    const [orientacoes, setOrientacoes] = useState([]);
    const [selectedCurso, setSelectedCurso] = useState(null);
    const [selectedAnoSemestre, setSelectedAnoSemestre] = useState(null);
    const [faseSelecionada, setFaseSelecionada] = useState('');
    const [loadingCursos, setLoadingCursos] = useState(false);
    const [loadingDocentes, setLoadingDocentes] = useState(false);
    const [loadingOfertasTcc, setLoadingOfertasTcc] = useState(false);
    const [loadingDicentes, setLoadingDicentes] = useState(false);
    const [loadingOrientacoes, setLoadingOrientacoes] = useState(false);
    const [openMessage, setOpenMessage] = React.useState(false);
    const [messageText, setMessageText] = React.useState("");
    const [messageSeverity, setMessageSeverity] = React.useState("success");
    const [orientacoesAlteradas, setOrientacoesAlteradas] = useState({});

    useEffect(() => {
        getCursos();
        getDocentes();
        getOfertasTcc();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // Só busca dicentes e orientações quando todos os filtros estão preenchidos
        if (selectedCurso && selectedAnoSemestre && faseSelecionada) {
            getDicentes();
            getOrientacoes();
        } else {
            setDicentes([]);
            setOrientacoes([]);
        }
    }, [selectedCurso, selectedAnoSemestre, faseSelecionada]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // Busca orientadores do curso selecionado
        if (selectedCurso) {
            getOrientadoresCurso(selectedCurso.id);
        } else {
            setOrientadoresCurso([]);
        }
    }, [selectedCurso]); // eslint-disable-line react-hooks/exhaustive-deps

    async function getCursos() {
        setLoadingCursos(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/cursos`);
            const data = await response.json();
            setCursos(data.cursos || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de cursos: ", error);
            setCursos([]);
        } finally {
            setLoadingCursos(false);
        }
    }

    async function getDocentes() {
        setLoadingDocentes(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/docentes`);
            const data = await response.json();
            setDocentes(data.docentes || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de docentes: ", error);
            setDocentes([]);
        } finally {
            setLoadingDocentes(false);
        }
    }

    async function getOrientadoresCurso(idCurso) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/orientadores/curso/${idCurso}`);
            const data = await response.json();
            setOrientadoresCurso(data.orientacoes || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de orientadores do curso: ", error);
            setOrientadoresCurso([]);
        }
    }

    async function getOfertasTcc() {
        setLoadingOfertasTcc(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/ofertas-tcc`);
            const data = await response.json();
            setOfertasTcc(data.ofertas || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de ofertas TCC: ", error);
            setOfertasTcc([]);
        } finally {
            setLoadingOfertasTcc(false);
        }
    }

    async function getDicentes() {
        setLoadingDicentes(true);
        try {
            const params = new URLSearchParams();

            if (selectedAnoSemestre) {
                const [ano, semestre] = selectedAnoSemestre.split('/');
                params.append('ano', ano);
                params.append('semestre', semestre);
            }

            if (faseSelecionada) {
                params.append('fase', faseSelecionada);
            }

            const url = `${process.env.REACT_APP_API_URL}/dicentes${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            // Ordena os dicentes por nome em ordem crescente
            const dicentesOrdenados = (data.dicentes || []).sort((a, b) => a.nome.localeCompare(b.nome));
            setDicentes(dicentesOrdenados);
        } catch (error) {
            console.log("Não foi possível retornar a lista de dicentes: ", error);
            setDicentes([]);
        } finally {
            setLoadingDicentes(false);
        }
    }

    async function getOrientacoes() {
        setLoadingOrientacoes(true);
        try {
            const url = `${process.env.REACT_APP_API_URL}/orientacoes`;
            console.log("Buscando orientações em:", url);
            const response = await fetch(url);
            const data = await response.json();
            console.log("Orientações carregadas do servidor:", data.orientacoes);
            setOrientacoes(data.orientacoes || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de orientações: ", error);
            setOrientacoes([]);
        } finally {
            setLoadingOrientacoes(false);
        }
    }

    function getOrientadorAtual(matricula) {
        if (!selectedCurso || !selectedAnoSemestre || !faseSelecionada) return '';

        const [ano, semestre] = selectedAnoSemestre.split('/');
        const orientacao = orientacoes.find(o =>
            o.matricula === matricula &&
            o.ano === parseInt(ano) &&
            o.semestre === parseInt(semestre) &&
            o.id_curso === selectedCurso.id &&
            o.fase === parseInt(faseSelecionada)
        );

        return orientacao ? orientacao.codigo || '' : '';
    }

    function handleOrientadorChange(matricula, codigoDocente) {
        if (!selectedCurso || !selectedAnoSemestre || !faseSelecionada) return;

        const [ano, semestre] = selectedAnoSemestre.split('/');
        const chave = `${matricula}_${ano}_${semestre}_${selectedCurso.id}_${faseSelecionada}`;

        setOrientacoesAlteradas(prev => ({
            ...prev,
            [chave]: {
                matricula: matricula,
                ano: parseInt(ano),
                semestre: parseInt(semestre),
                id_curso: selectedCurso.id,
                fase: parseInt(faseSelecionada),
                codigo: codigoDocente || null
            }
        }));
    }

    async function salvarOrientacoes() {
        try {
            const orientacoesParaSalvar = Object.values(orientacoesAlteradas);
            console.log("Orientações para salvar:", orientacoesParaSalvar);

            for (const orientacao of orientacoesParaSalvar) {
                console.log("Processando orientação:", orientacao);

                // Verifica se já existe uma orientação
                const orientacaoExistente = orientacoes.find(o =>
                    o.matricula === orientacao.matricula &&
                    o.ano === orientacao.ano &&
                    o.semestre === orientacao.semestre &&
                    o.id_curso === orientacao.id_curso &&
                    o.fase === orientacao.fase
                );

                console.log("Orientação existente:", orientacaoExistente);

                // Validar dados obrigatórios
                if (!orientacao.matricula || !orientacao.ano || !orientacao.semestre || !orientacao.id_curso || !orientacao.fase) {
                    throw new Error(`Dados obrigatórios faltando na orientação: ${JSON.stringify(orientacao)}`);
                }

                if (orientacaoExistente) {
                    console.log("Atualizando orientação existente");
                    const url = `${process.env.REACT_APP_API_URL}/orientacoes`;
                    console.log("URL para atualização:", url);
                    console.log("Dados para atualização:", orientacao);

                    const response = await fetch(url, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            formData: orientacao,
                        }),
                    });

                    console.log("Status da resposta (PUT):", response.status);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error("Erro do servidor ao atualizar:", errorData);
                        throw new Error(`Erro ao atualizar orientação: ${errorData.error || 'Erro desconhecido'}`);
                    }
                } else {
                    console.log("Criando nova orientação");
                    const url = `${process.env.REACT_APP_API_URL}/orientacoes`;
                    console.log("URL para criação:", url);
                    console.log("Dados para criação:", orientacao);

                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            formData: orientacao,
                        }),
                    });

                    console.log("Status da resposta (POST):", response.status);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error("Erro do servidor ao criar:", errorData);
                        throw new Error(`Erro ao criar orientação: ${errorData.error || 'Erro desconhecido'}`);
                    }
                }
            }

            setMessageText("Orientações salvas com sucesso!");
            setMessageSeverity("success");
            setOrientacoesAlteradas({});
            // Atualiza a lista de orientações
            await getOrientacoes();
        } catch (error) {
            console.error("Erro ao salvar orientações:", error);
            setMessageText(`Falha ao salvar orientações: ${error.message}`);
            setMessageSeverity("error");
        } finally {
            setOpenMessage(true);
        }
    }

    function handleCursoChange(e) {
        const curso = cursos.find(c => c.id === e.target.value);
        setSelectedCurso(curso || null);
        setOrientacoesAlteradas({}); // Limpa alterações pendentes
    }

    function handleAnoSemestreChange(e) {
        setSelectedAnoSemestre(e.target.value || null);
        setOrientacoesAlteradas({}); // Limpa alterações pendentes
    }

    function handleFaseChange(e) {
        setFaseSelecionada(e.target.value || '');
        setOrientacoesAlteradas({}); // Limpa alterações pendentes
    }

    function handleCloseMessage(_, reason) {
        if (reason === "clickaway") {
            return;
        }
        setOpenMessage(false);
    }

    // Gerar listas únicas a partir das ofertas TCC
    const anosSemsestresUnicos = [...new Set(ofertasTcc.map(oferta => `${oferta.ano}/${oferta.semestre}`))].sort();
    const fasesUnicas = [...new Set(ofertasTcc.map(oferta => oferta.fase.toString()))].sort();

    // Filtrar apenas docentes que podem orientar no curso selecionado
    const docentesDisponiveis = selectedCurso
        ? orientadoresCurso.map(oc => oc.docente)
        : [];

    // Configuração das colunas do DataGrid
    const columns = [
        { field: "matricula", headerName: "Matrícula", width: 150 },
        { field: "nome", headerName: "Nome do Dicente", width: 350 },
        { field: "email", headerName: "Email", width: 300 },
        {
            field: "orientador",
            headerName: "Orientador",
            width: 250,
            sortable: false,
            renderCell: (params) => {
                const orientadorAtual = getOrientadorAtual(params.row.matricula);
                const chave = selectedAnoSemestre && faseSelecionada
                    ? `${params.row.matricula}_${selectedAnoSemestre.replace('/', '_')}_${selectedCurso.id}_${faseSelecionada}`
                    : null;
                const orientadorSelecionado = chave && orientacoesAlteradas[chave]
                    ? orientacoesAlteradas[chave].codigo || ''
                    : orientadorAtual;

                return (
                    <FormControl
                        fullWidth
                        size="small"
                        disabled={!selectedAnoSemestre || !faseSelecionada}
                    >
                        <Select
                            value={orientadorSelecionado}
                            onChange={(e) => handleOrientadorChange(params.row.matricula, e.target.value)}
                            displayEmpty
                        >
                            <MenuItem value="">
                                <em>Sem orientador</em>
                            </MenuItem>
                            {docentesDisponiveis.map((docente) => (
                                <MenuItem key={docente.codigo} value={docente.codigo}>
                                    {docente.nome}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            },
        },
    ];

    return (
        <Box>
            <Stack spacing={2}>
                <Typography variant="h5" component="h2">
                    Gerenciamento de Orientações
                </Typography>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                    <FormControl
                        sx={{
                            minWidth: { xs: "100%", sm: 300 },
                            width: { xs: "100%", sm: "auto" },
                        }}
                    >
                        <InputLabel>Curso *</InputLabel>
                        <Select
                            value={selectedCurso ? selectedCurso.id : ""}
                            onChange={handleCursoChange}
                            label="Curso *"
                            disabled={loadingCursos || cursos.length === 0}
                            startAdornment={
                                loadingCursos && (
                                    <CircularProgress
                                        size={16}
                                        sx={{ mr: 1 }}
                                    />
                                )
                            }
                        >
                            <MenuItem value="">
                                <em>Selecione um curso</em>
                            </MenuItem>
                            {cursos.map((curso) => (
                                <MenuItem key={curso.id} value={curso.id}>
                                    {curso.nome} ({curso.codigo})
                                </MenuItem>
                            ))}
                            {cursos.length === 0 && !loadingCursos && (
                                <MenuItem disabled>
                                    Nenhum curso encontrado
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    <FormControl
                        sx={{
                            minWidth: { xs: "100%", sm: 200 },
                            width: { xs: "100%", sm: "auto" },
                        }}
                    >
                        <InputLabel>Ano/Semestre</InputLabel>
                        <Select
                            value={selectedAnoSemestre || ""}
                            onChange={handleAnoSemestreChange}
                            label="Ano/Semestre"
                            disabled={
                                loadingOfertasTcc ||
                                anosSemsestresUnicos.length === 0 ||
                                loadingDicentes
                            }
                            startAdornment={
                                (loadingOfertasTcc || loadingDicentes) && (
                                    <CircularProgress
                                        size={16}
                                        sx={{ mr: 1 }}
                                    />
                                )
                            }
                        >
                            <MenuItem value="">
                                <em>Todos os períodos</em>
                            </MenuItem>
                            {anosSemsestresUnicos.map((anoSemestre) => (
                                <MenuItem key={anoSemestre} value={anoSemestre}>
                                    {anoSemestre}º Semestre
                                </MenuItem>
                            ))}
                            {anosSemsestresUnicos.length === 0 && !loadingOfertasTcc && (
                                <MenuItem disabled>
                                    Nenhum ano/semestre cadastrado
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    <FormControl
                        sx={{
                            minWidth: { xs: "100%", sm: 120 },
                            width: { xs: "100%", sm: "auto" },
                        }}
                    >
                        <InputLabel>Fase TCC</InputLabel>
                        <Select
                            value={faseSelecionada || ""}
                            label="Fase TCC"
                            onChange={handleFaseChange}
                            disabled={
                                loadingOfertasTcc ||
                                fasesUnicas.length === 0 ||
                                loadingDicentes
                            }
                            startAdornment={
                                (loadingOfertasTcc || loadingDicentes) && (
                                    <CircularProgress
                                        size={16}
                                        sx={{ mr: 1 }}
                                    />
                                )
                            }
                        >
                            <MenuItem value="">
                                <em>Todas as fases</em>
                            </MenuItem>
                            {fasesUnicas.map((fase) => (
                                <MenuItem key={fase} value={fase}>
                                    Fase {fase}
                                </MenuItem>
                            ))}
                            {fasesUnicas.length === 0 && !loadingOfertasTcc && (
                                <MenuItem disabled>
                                    Nenhuma fase cadastrada
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    <Box display="flex" alignItems="center" sx={{ minWidth: 150 }}>
                        {loadingDicentes ? (
                            <Box display="flex" alignItems="center">
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Carregando...
                                </Typography>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                {`${dicentes.length} dicente${dicentes.length !== 1 ? 's' : ''} encontrado${dicentes.length !== 1 ? 's' : ''}`}
                            </Typography>
                        )}
                    </Box>
                </Stack>

                {Object.keys(orientacoesAlteradas).length > 0 && (selectedCurso && selectedAnoSemestre && faseSelecionada) && (
                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={salvarOrientacoes}
                        >
                            Salvar Alterações ({Object.keys(orientacoesAlteradas).length})
                        </Button>
                    </Box>
                )}

                {/* Mensagem informativa sobre filtros */}
                {(!selectedCurso || !selectedAnoSemestre || !faseSelecionada) && (
                    <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <Typography variant="body2">
                            <strong>Selecione todos os filtros</strong> (curso, ano/semestre e fase) para visualizar e gerenciar as orientações.
                        </Typography>
                    </Paper>
                )}

                {/* Exibição de filtros ativos */}
                {(selectedCurso && selectedAnoSemestre && faseSelecionada) && (
                    <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <Typography variant="body2">
                            <strong>Filtros ativos:</strong>
                            {selectedCurso && ` Curso: ${selectedCurso.nome}`}
                            {selectedAnoSemestre && ` | Ano/Semestre: ${selectedAnoSemestre}`}
                            {faseSelecionada && ` | Fase: ${faseSelecionada}`}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {docentesDisponiveis.length} orientador(es) disponível(is) para este curso.
                        </Typography>
                    </Paper>
                )}

                {/* DataGrid de dicentes e orientações */}
                {(selectedCurso && selectedAnoSemestre && faseSelecionada) && dicentes.length > 0 && (
                    <Box style={{ height: "500px" }}>
                        <DataGrid
                            rows={dicentes}
                            columns={columns}
                            pageSize={10}
                            checkboxSelection={false}
                            disableSelectionOnClick
                            getRowId={(row) => row.matricula}
                            initialState={{
                                sorting: {
                                    sortModel: [{ field: 'nome', sort: 'asc' }],
                                },
                            }}
                        />
                    </Box>
                )}

                {(selectedCurso && selectedAnoSemestre && faseSelecionada) && dicentes.length === 0 && !loadingDicentes && (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Nenhum dicente encontrado com os filtros aplicados.
                        </Typography>
                    </Paper>
                )}

                <Snackbar
                    open={openMessage}
                    autoHideDuration={6000}
                    onClose={handleCloseMessage}
                >
                    <Alert
                        severity={messageSeverity}
                        onClose={handleCloseMessage}
                    >
                        {messageText}
                    </Alert>
                </Snackbar>
            </Stack>
        </Box>
    );
}