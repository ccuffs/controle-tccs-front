import React from "react";
import {
	Box,
	IconButton,
	Menu,
	MenuItem,
	Typography,
	Avatar,
	Divider,
	Switch,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { useAuth } from "../contexts/AuthContext";
import { useThemeContext } from "./customs/CustomThemeProvider";
import { useUserMenu } from "../hooks/useUserMenu.js";

export default function UserMenu() {
	const { usuario, logout } = useAuth();
	const { toggleTheme } = useThemeContext();
	const { anchorEl, isDarkMode, handleMenu, handleClose, handleLogout } =
		useUserMenu({ logout });

	if (!usuario) {
		return null;
	}

	return (
		<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.5,
				}}
			>
				{isDarkMode ? (
					<DarkModeIcon sx={{ fontSize: 20 }} />
				) : (
					<LightModeIcon sx={{ fontSize: 20 }} />
				)}
				<Switch
					checked={isDarkMode}
					onChange={toggleTheme}
					size="small"
					sx={{
						"& .MuiSwitch-thumb": {
							bgcolor: "background.paper",
						},
					}}
				/>
			</Box>
			<IconButton
				size="large"
				aria-label="menu do usuário"
				aria-controls="menu-appbar"
				aria-haspopup="true"
				onClick={handleMenu}
				color="inherit"
			>
				<Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
					{usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
				</Avatar>
			</IconButton>
			<Menu
				id="menu-appbar"
				anchorEl={anchorEl}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				keepMounted
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				open={Boolean(anchorEl)}
				onClose={handleClose}
			>
				<MenuItem disabled>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
						}}
					>
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: "bold" }}
						>
							{usuario.nome}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							ID: {usuario.id}
						</Typography>
					</Box>
				</MenuItem>
				<Divider />
				<MenuItem onClick={handleLogout}>
					<LogoutIcon sx={{ mr: 1 }} />
					Sair
				</MenuItem>
			</Menu>
		</Box>
	);
}
