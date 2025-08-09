import React, { useEffect, useMemo, useState } from "react";
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
import axiosInstance from "../auth/axios";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

// Props esperadas:
// - oferta: { ano, semestre, id_curso, fase }
// - codigoOrientador: string
// - codigosMembrosBanca: string[] (esperado tamanho 2)
// - onChange: (slot | null) => void
// - selectedSlot: { data: string, hora: string } | null
export default function SelecionarHorarioBanca({
	oferta,
	codigoOrientador,
	codigosMembrosBanca = [],
	onChange,
	selectedSlot,
}) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [gradeBase, setGradeBase] = useState(null); // datas/horarios
	const [disponOrientador, setDisponOrientador] = useState(new Set());
	const [disponMembro1, setDisponMembro1] = useState(new Set());
	const [disponMembro2, setDisponMembro2] = useState(new Set());

	const possuiMembrosValidos =
		!!codigoOrientador &&
		Array.isArray(codigosMembrosBanca) &&
		codigosMembrosBanca.length === 2;

	useEffect(() => {
		async function carregar() {
			if (!oferta || !possuiMembrosValidos) return;
			setLoading(true);
			setError("");
			try {
				const { ano, semestre, id_curso, fase } = oferta;

				// Buscar grade para cada docente em paralelo
				const [respOrient, respM1, respM2] = await Promise.all([
					axiosInstance.get(
						`/disponibilidade-banca/grade/${codigoOrientador}/${ano}/${semestre}/${id_curso}/${fase}`,
					),
					axiosInstance.get(
						`/disponibilidade-banca/grade/${codigosMembrosBanca[0]}/${ano}/${semestre}/${id_curso}/${fase}`,
					),
					axiosInstance.get(
						`/disponibilidade-banca/grade/${codigosMembrosBanca[1]}/${ano}/${semestre}/${id_curso}/${fase}`,
					),
				]);

				// Preservar referência de datas/horarios (usaremos do orientador como base)
				const base = respOrient.grade || respOrient.data?.grade || null;
				setGradeBase(base);

				const toKey = (d, h) => `${d}|${h}`;
				const extrairSet = (resp) => {
					const grade = resp.grade || resp.data?.grade || null;
					const set = new Set();
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
				setError("Erro ao carregar disponibilidades dos docentes.");
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
		if (!gradeBase) return [];
		const keysComuns = [];
		const toKey = (d, h) => `${d}|${h}`;
		const fromKey = (k) => {
			const [data, hora] = k.split("|");
			return { data, hora };
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
		const porData = slots.reduce((acc, { data, hora }) => {
			if (!acc[data]) acc[data] = [];
			acc[data].push(hora);
			return acc;
		}, {});
		// Ordenar horários
		Object.keys(porData).forEach((d) => {
			porData[d].sort();
		});
		return porData;
	}, [gradeBase, disponOrientador, disponMembro1, disponMembro2]);

	const formatarData = (data) => {
		const [ano, mes, dia] = data.split("-");
		return `${dia}/${mes}/${ano}`;
	};

	const formatarHora = (hora) => hora?.substring(0, 5);

	const handleSelect = (data, hora) => {
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

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Selecione um horário comum para a banca
			</Typography>

			{!gradeBase && (
				<Alert severity="info">
					Não há grade de datas/horários configurada para esta oferta.
				</Alert>
			)}

			{gradeBase && Object.keys(intersecao).length === 0 && (
				<Alert severity="info">
					Não foi encontrada nenhuma interseção de horário entre o
					orientador e os dois membros da banca.
				</Alert>
			)}

			{gradeBase && Object.keys(intersecao).length > 0 && (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{Object.keys(intersecao)
						.sort()
						.map((data) => (
							<Paper key={data} sx={{ p: 2 }}>
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
									{intersecao[data].map((hora) => {
										const isSelected =
											selectedSlot &&
											selectedSlot.data === data &&
											selectedSlot.hora === hora;
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
