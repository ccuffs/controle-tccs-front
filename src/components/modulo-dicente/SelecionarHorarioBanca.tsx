import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Typography,
	Paper,
	Alert,
	CircularProgress,
	Button,
	Chip,
	Divider,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import axiosInstance from "../../auth/axios";
import { getErrorMessage } from "../../utils/apiError";

const MENSAGEM_DATAS_NAO_DEFINIDAS =
	"As datas de defesa ainda não foram definidas.";

function isDatasDefesaAusentes(error: unknown): boolean {
	if (axios.isAxiosError(error) && error.response?.status === 404) {
		return true;
	}
	return getErrorMessage(error, "")
		.toLowerCase()
		.includes("datas de defesa não encontradas");
}

interface Oferta {
	ano: number;
	semestre: number;
	id_curso: number;
	fase: number;
}

interface Slot {
	data: string;
	hora: string;
}

interface Disponibilidade {
	data_defesa: string;
	hora_defesa: string;
	disponivel?: boolean;
}

interface Grade {
	datas?: string[];
	disponibilidades?: Disponibilidade[];
	[key: string]: unknown;
}

interface SelecionarHorarioBancaProps {
	oferta: Oferta | null;
	codigoOrientador: string | null;
	codigosMembrosBanca?: string[];
	onChange: (slot: Slot | null) => void;
	selectedSlot: Slot | null;
}

export default function SelecionarHorarioBanca({
	oferta,
	codigoOrientador,
	codigosMembrosBanca = [],
	onChange,
	selectedSlot,
}: SelecionarHorarioBancaProps) {
	const theme = useTheme();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [gradeBase, setGradeBase] = useState<Grade | null>(null); // datas/horarios
	const [disponOrientador, setDisponOrientador] = useState<Set<string>>(new Set());
	const [disponMembro1, setDisponMembro1] = useState<Set<string>>(new Set());
	const [disponMembro2, setDisponMembro2] = useState<Set<string>>(new Set());

	const possuiMembrosValidos =
		!!codigoOrientador &&
		Array.isArray(codigosMembrosBanca) &&
		codigosMembrosBanca.length === 2;

	useEffect(() => {
		async function carregar() {
			if (!oferta || !possuiMembrosValidos) {
				setLoading(false);
				return;
			}
			setLoading(true);
			setError("");
			try {
				const { ano, semestre, id_curso, fase } = oferta;

				// Buscar grade para cada docente em paralelo
				const [respOrient, respM1, respM2] = await Promise.all([
					axiosInstance.get<{ grade?: Grade }>(
						`/disponibilidade-banca/grade/${codigoOrientador}/${ano}/${semestre}/${id_curso}/${fase}`,
					),
					axiosInstance.get<{ grade?: Grade }>(
						`/disponibilidade-banca/grade/${codigosMembrosBanca[0]}/${ano}/${semestre}/${id_curso}/${fase}`,
					),
					axiosInstance.get<{ grade?: Grade }>(
						`/disponibilidade-banca/grade/${codigosMembrosBanca[1]}/${ano}/${semestre}/${id_curso}/${fase}`,
					),
				]);

				// Preservar referência de datas/horarios (usaremos do orientador como base)
				const base = respOrient.grade || null;
				const datas = Array.isArray(base?.datas) ? base.datas : [];
				if (!base || datas.length === 0) {
					setGradeBase(null);
					return;
				}
				setGradeBase(base);

				const toKey = (d: string, h: string) => `${d}|${h}`;
				const extrairSet = (resp: { grade?: Grade }) => {
					const grade = resp.grade || null;
					const set = new Set<string>();
					if (grade && Array.isArray(grade.disponibilidades)) {
						grade.disponibilidades.forEach((disp) => {
							const data = disp.data_defesa;
							const hora = disp.hora_defesa;
							if (disp.disponivel !== false && data && hora) {
								set.add(toKey(data, hora));
							}
						});
					}
					return set;
				};

				setDisponOrientador(extrairSet(respOrient));
				setDisponMembro1(extrairSet(respM1));
				setDisponMembro2(extrairSet(respM2));
			} catch (e) {
				console.error(e);
				if (isDatasDefesaAusentes(e)) {
					setGradeBase(null);
					setError("");
				} else {
					setError("Erro ao carregar disponibilidades dos docentes.");
				}
			} finally {
				setLoading(false);
			}
		}
		carregar();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		JSON.stringify(oferta),
		codigoOrientador,
		JSON.stringify(codigosMembrosBanca),
	]);

	const intersecao = useMemo(() => {
		if (!gradeBase) return {} as Record<string, string[]>;
		const keysComuns: string[] = [];
		const toKey = (d: string, h: string) => `${d}|${h}`;
		const fromKey = (k: string) => {
			const [data, hora] = k.split("|");
			return { data: data ?? "", hora: hora ?? "" };
		};
		(gradeBase.disponibilidades || []).forEach((disp) => {
			const k = toKey(disp.data_defesa, disp.hora_defesa);
			if (
				disponOrientador.has(k) &&
				disponMembro1.has(k) &&
				disponMembro2.has(k)
			) {
				keysComuns.push(k);
			}
		});
		const slots = keysComuns.map(fromKey);

		// Agrupar por data para exibir organizado
		const porData = slots.reduce<Record<string, string[]>>((acc, { data, hora }) => {
			if (!acc[data]) acc[data] = [];
			acc[data].push(hora);
			return acc;
		}, {});
		// Ordenar horários
		Object.keys(porData).forEach((d) => {
			porData[d]?.sort();
		});
		return porData;
	}, [gradeBase, disponOrientador, disponMembro1, disponMembro2]);

	const formatarData = (data: string) => {
		const [ano, mes, dia] = data.split("-");
		return `${dia}/${mes}/${ano}`;
	};

	const formatarHora = (hora: string) => hora?.substring(0, 5);

	const handleSelect = (data: string, hora: string) => {
		if (onChange) onChange({ data, hora });
	};

	const handleLimpar = () => {
		if (onChange) onChange(null);
	};

	if (!possuiMembrosValidos) {
		return (
			<Alert severity="warning">
				É necessário ter um orientador e exatamente 2 membros de banca
				aceitos para selecionar um horário.
			</Alert>
		);
	}

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Alert severity="error" sx={{ mb: 2 }}>
				{error}
			</Alert>
		);
	}

	if (!gradeBase) {
		return (
			<Alert severity="info" sx={{ mb: 2 }}>
				{MENSAGEM_DATAS_NAO_DEFINIDAS}
			</Alert>
		);
	}

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Selecione um horário comum para a banca
			</Typography>

			{Object.keys(intersecao).length === 0 && (
				<Alert severity="info">
					Não foi encontrada nenhuma interseção de horário entre o
					orientador e os dois membros da banca.
				</Alert>
			)}

			{Object.keys(intersecao).length > 0 && (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{Object.keys(intersecao)
						.sort()
						.map((data) => (
							<Paper
								key={data}
								sx={{
									p: 2,
									backgroundColor:
										theme.palette.background.default,
								}}
							>
								<Typography variant="subtitle2" gutterBottom>
									{formatarData(data)}
								</Typography>
								<Box
									sx={{
										display: "flex",
										flexWrap: "wrap",
										gap: 1,
									}}
								>
									{intersecao[data]?.map((hora) => {
										const isSelected = Boolean(
											selectedSlot &&
											selectedSlot.data === data &&
											selectedSlot.hora === hora,
										);
										return (
											<Chip
												key={`${data}-${hora}`}
												label={formatarHora(hora)}
												color={
													isSelected
														? "success"
														: "default"
												}
												variant={
													isSelected
														? "filled"
														: "outlined"
												}
												icon={
													isSelected ? (
														<CheckCircleOutlineIcon />
													) : undefined
												}
												onClick={() =>
													handleSelect(data, hora)
												}
												clickable
												sx={
													isSelected
														? {
																fontWeight: 700,
																boxShadow: 2,
															}
														: {}
												}
											/>
										);
									})}
								</Box>
							</Paper>
						))}

					{selectedSlot && (
						<>
							<Divider />
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 2,
								}}
							>
								<Typography variant="body2">
									Selecionado:{" "}
									{formatarData(selectedSlot.data)} às{" "}
									{formatarHora(selectedSlot.hora)}
								</Typography>
								<Button size="small" onClick={handleLimpar}>
									Limpar seleção
								</Button>
							</Box>
						</>
					)}
				</Box>
			)}
		</Box>
	);
}
