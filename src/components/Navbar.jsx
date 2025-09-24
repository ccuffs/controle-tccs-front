import React from "react";
import {
	AppBar,
	Toolbar,
	IconButton,
	Typography,
	Button,
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Box,
	useTheme,
	useMediaQuery,
	Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router";
import { DrawerContext } from "./App";
import { useAuth } from "../contexts/AuthContext";
import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import UserMenu from "./UserMenu";

const drawerWidth = 240;

function Navbar() {
	const [mobileOpen, setMobileOpen] = React.useState(false);
	const { desktopOpen, setDesktopOpen } = React.useContext(DrawerContext);
	const { isAuthenticated, gruposUsuario } = useAuth();
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	// Verifica se o usuário é um estudante
	const isEstudante = gruposUsuario.some(
		(grupo) => grupo.id === Permissoes.GRUPOS.ESTUDANTE,
	);

	function handleDrawerToggle() {
		setMobileOpen(!mobileOpen);
	}

	function handleDesktopDrawerToggle() {
		setDesktopOpen(!desktopOpen);
	}

	function closeAnyDrawer() {
		if (isMobile) {
			setMobileOpen(false);
		} else if (desktopOpen) {
			setDesktopOpen(false);
		}
	}

	function handleClickHome() {
		navigate("/");
		closeAnyDrawer();
	}

	function handleClickCursos() {
		navigate("/cursos");
		closeAnyDrawer();
	}

	function handleClickOrientadores() {
		navigate("/orientadores");
		closeAnyDrawer();
	}

	function handleClickDicentes() {
		navigate("/dicentes");
		closeAnyDrawer();
	}

	function handleClickOrientacoes() {
		navigate("/orientacoes");
		closeAnyDrawer();
	}

	function handleClickTemasTcc() {
		navigate("/temas-tcc");
		closeAnyDrawer();
	}

	function handleClickModuloOrientador() {
		navigate("/modulo-orientador");
		closeAnyDrawer();
	}

	function handleClickModuloDiscente() {
		navigate("/modulo-discente");
		closeAnyDrawer();
	}

	const drawerContent = (
		<Box sx={{ overflow: "auto" }}>
			<Toolbar>
				<Typography variant="h6" noWrap component="div">
					Menu
				</Typography>
			</Toolbar>
			<Divider />
			<List>
				<PermissionContext
					grupos={[
						Permissoes.GRUPOS.ADMIN,
						Permissoes.GRUPOS.PROFESSOR,
					]}
					showError={false}
				>
					<ListItem disablePadding>
						<ListItemButton onClick={handleClickHome}>
							<ListItemText primary="Dashboard" />
						</ListItemButton>
					</ListItem>
				</PermissionContext>
				<PermissionContext
					grupos={[Permissoes.GRUPOS.ADMIN]}
					showError={false}
				>
					<ListItem disablePadding>
						<ListItemButton onClick={handleClickCursos}>
							<ListItemText primary="Cursos" />
						</ListItemButton>
					</ListItem>
				</PermissionContext>
				<PermissionContext
					grupos={[
						Permissoes.GRUPOS.ADMIN,
						Permissoes.GRUPOS.PROFESSOR,
					]}
					showError={false}
				>
					<ListItem disablePadding>
						<ListItemButton onClick={handleClickOrientadores}>
							<ListItemText primary="Orientadores" />
						</ListItemButton>
					</ListItem>

					<ListItem disablePadding>
						<ListItemButton onClick={handleClickDicentes}>
							<ListItemText primary="Dicentes" />
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton onClick={handleClickOrientacoes}>
							<ListItemText primary="Orientações" />
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton onClick={handleClickTemasTcc}>
							<ListItemText primary="Temas TCC" />
						</ListItemButton>
					</ListItem>
				</PermissionContext>
				<PermissionContext
					grupos={[Permissoes.GRUPOS.ORIENTADOR]}
					showError={false}
				>
					<ListItem disablePadding>
						<ListItemButton onClick={handleClickModuloOrientador}>
							<ListItemText primary="Módulo do Orientador" />
						</ListItemButton>
					</ListItem>
				</PermissionContext>
				<PermissionContext
					grupos={[Permissoes.GRUPOS.ESTUDANTE]}
					showError={false}
				>
					<ListItem disablePadding>
						<ListItemButton onClick={handleClickModuloDiscente}>
							<ListItemText primary="Módulo do Discente" />
						</ListItemButton>
					</ListItem>
				</PermissionContext>
			</List>
		</Box>
	);

	return (
		<Box sx={{ display: "flex" }}>
			<AppBar
				position="fixed"
				sx={{
					width: "100%",
					ml: 0,
					zIndex: (theme) => theme.zIndex.drawer + 1,
					transition: theme.transitions.create(["width", "margin"], {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.leavingScreen,
					}),
				}}
			>
				<Toolbar>
					{isAuthenticated && !isEstudante && (
						<IconButton
							color="inherit"
							aria-label="open drawer"
							edge="start"
							onClick={
								isMobile
									? handleDrawerToggle
									: handleDesktopDrawerToggle
							}
							sx={{ mr: 2 }}
						>
							<MenuIcon />
						</IconButton>
					)}
					<Typography
						variant="h6"
						component="div"
						sx={{ flexGrow: 1, cursor: "pointer" }}
						onClick={handleClickHome}
						data-testid="system-title"
					>
						Sistema de Gestão de TCCs
					</Typography>
					{isAuthenticated ? (
						<UserMenu />
					) : (
						<Button
							color="inherit"
							onClick={() => navigate("/login")}
						>
							Login
						</Button>
					)}
				</Toolbar>
			</AppBar>

			{/* Mobile drawer */}
			{isAuthenticated && !isEstudante && (
				<Drawer
					variant="temporary"
					open={mobileOpen}
					onClose={handleDrawerToggle}
					ModalProps={{
						keepMounted: true, // Better open performance on mobile.
					}}
					sx={{
						display: { xs: "block", md: "none" },
						"& .MuiDrawer-paper": {
							boxSizing: "border-box",
							width: drawerWidth,
						},
					}}
				>
					{drawerContent}
				</Drawer>
			)}

			{/* Desktop drawer as overlay (temporary) */}
			{isAuthenticated && !isEstudante && (
				<Drawer
					variant="temporary"
					open={desktopOpen}
					onClose={handleDesktopDrawerToggle}
					ModalProps={{ keepMounted: true }}
					sx={{
						display: { xs: "none", md: "block" },
						"& .MuiDrawer-paper": {
							width: drawerWidth,
							boxSizing: "border-box",
						},
					}}
				>
					{drawerContent}
				</Drawer>
			)}
		</Box>
	);
}

export default Navbar;
