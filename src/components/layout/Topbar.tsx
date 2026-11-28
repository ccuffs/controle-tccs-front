import { useState, type MouseEvent } from "react";
import { Divider, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { mesmoPeriodo, rotuloPeriodo, type EscolhaPeriodo } from "../../contexts/PeriodoContext";
import type { AnoSemestre } from "../../types/dashboard";
import { Avatar, Icon, PlainButton } from "../ui";
import { PERFIS, type Perfil } from "./navegacao";

interface TopbarProps {
	tituloPagina: string;
	nomeUsuario: string;
	perfil: Perfil | null;
	perfisDisponiveis: Perfil[];
	periodos: AnoSemestre[];
	periodoSelecionado: EscolhaPeriodo | null;
	escuro: boolean;
	onAbrirMenu: () => void;
	onSelecionarPeriodo: (periodo: EscolhaPeriodo) => void;
	onAlternarTema: () => void;
	onTrocarPerfil: (perfil: Perfil) => void;
	onSair: () => void;
}

export function Topbar({
	tituloPagina,
	nomeUsuario,
	perfil,
	perfisDisponiveis,
	periodos,
	periodoSelecionado,
	escuro,
	onAbrirMenu,
	onSelecionarPeriodo,
	onAlternarTema,
	onTrocarPerfil,
	onSair,
}: TopbarProps) {
	const [ancoraPeriodo, setAncoraPeriodo] = useState<HTMLElement | null>(null);
	const [ancoraPerfil, setAncoraPerfil] = useState<HTMLElement | null>(null);

	return (
		<header className="topbar">
			<div className="topbar-left">
				<PlainButton className="icon-button hamburger" onClick={onAbrirMenu} aria-label="Abrir menu">
					<Icon name="menu" />
				</PlainButton>
				<div className="breadcrumb">
					<span>Gestão de TCCs</span>
					<Icon name="chevron_right" size={16} />
					<strong>{tituloPagina}</strong>
				</div>
			</div>
			<div className="top-actions">
				<PlainButton
					className="period"
					onClick={(event: MouseEvent<HTMLElement>) => setAncoraPeriodo(event.currentTarget)}
					aria-label="Selecionar período letivo"
					disabled={periodos.length === 0}
				>
					<Icon name="calendar_month" />
					<span>
						<small>PERÍODO</small>
						<strong>{rotuloPeriodo(periodoSelecionado)}</strong>
					</span>
					<Icon name="expand_more" size={18} />
				</PlainButton>
				<Menu anchorEl={ancoraPeriodo} open={Boolean(ancoraPeriodo)} onClose={() => setAncoraPeriodo(null)}>
					<MenuItem
						selected={periodoSelecionado === "todos"}
						onClick={() => {
							onSelecionarPeriodo("todos");
							setAncoraPeriodo(null);
						}}
					>
						Todos os períodos
					</MenuItem>
					<Divider />
					{periodos.map((periodo) => {
						const selecionado = periodoSelecionado !== "todos" && mesmoPeriodo(periodoSelecionado, periodo);
						return (
							<MenuItem
								key={rotuloPeriodo(periodo)}
								selected={selecionado}
								onClick={() => {
									onSelecionarPeriodo(periodo);
									setAncoraPeriodo(null);
								}}
							>
								{rotuloPeriodo(periodo)}
							</MenuItem>
						);
					})}
				</Menu>

				<PlainButton className="icon-button theme-toggle" onClick={onAlternarTema} aria-label="Alternar tema">
					<Icon name={escuro ? "light_mode" : "dark_mode"} />
				</PlainButton>

				<PlainButton
					className="profile-menu"
					onClick={(event: MouseEvent<HTMLElement>) => setAncoraPerfil(event.currentTarget)}
					aria-label="Menu do usuário"
					sx={{ color: "inherit" }}
				>
					<Avatar nome={nomeUsuario} />
					<span>
						<strong>{nomeUsuario}</strong>
						<small>{perfil ? PERFIS[perfil].rotulo : ""}</small>
					</span>
					<Icon name="expand_more" size={18} />
				</PlainButton>
				<Menu
					anchorEl={ancoraPerfil}
					open={Boolean(ancoraPerfil)}
					onClose={() => setAncoraPerfil(null)}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
					transformOrigin={{ vertical: "top", horizontal: "right" }}
				>
					{perfisDisponiveis.length > 1 &&
						perfisDisponiveis.map((opcao) => (
							<MenuItem
								key={opcao}
								selected={opcao === perfil}
								onClick={() => {
									setAncoraPerfil(null);
									onTrocarPerfil(opcao);
								}}
							>
								<ListItemIcon>
									<Icon name={opcao === perfil ? "radio_button_checked" : "radio_button_unchecked"} size={18} />
								</ListItemIcon>
								{PERFIS[opcao].rotulo}
							</MenuItem>
						))}
					{perfisDisponiveis.length > 1 && <Divider />}
					<MenuItem
						onClick={() => {
							setAncoraPerfil(null);
							onSair();
						}}
					>
						<ListItemIcon>
							<Icon name="logout" size={18} />
						</ListItemIcon>
						Sair
					</MenuItem>
				</Menu>
			</div>
		</header>
	);
}
