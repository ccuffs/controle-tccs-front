import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useMediaQuery, useTheme } from "@mui/material";

const drawerWidth = 240;

export function useNavbar({ desktopOpen, setDesktopOpen }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const handleDrawerToggle = useCallback(() => {
		setMobileOpen((prev) => !prev);
	}, []);

	const handleDesktopDrawerToggle = useCallback(() => {
		setDesktopOpen((prev) => !prev);
	}, [setDesktopOpen]);

	const closeAnyDrawer = useCallback(() => {
		if (isMobile) {
			setMobileOpen(false);
		} else if (desktopOpen) {
			setDesktopOpen(false);
		}
	}, [isMobile, desktopOpen]);

	const navigateAndClose = useCallback(
		(path) => {
			navigate(path);
			closeAnyDrawer();
		},
		[navigate, closeAnyDrawer],
	);

	const handleClickHome = useCallback(() => {
		navigateAndClose("/");
	}, [navigateAndClose]);

	const handleClickCursos = useCallback(() => {
		navigateAndClose("/cursos");
	}, [navigateAndClose]);

	const handleClickOrientadores = useCallback(() => {
		navigateAndClose("/orientadores");
	}, [navigateAndClose]);

	const handleClickDicentes = useCallback(() => {
		navigateAndClose("/dicentes");
	}, [navigateAndClose]);

	const handleClickOrientacoes = useCallback(() => {
		navigateAndClose("/orientacoes");
	}, [navigateAndClose]);

	const handleClickTemasTcc = useCallback(() => {
		navigateAndClose("/temas-tcc");
	}, [navigateAndClose]);

	const handleClickModuloOrientador = useCallback(() => {
		navigateAndClose("/modulo-orientador");
	}, [navigateAndClose]);

	const handleClickModuloDiscente = useCallback(() => {
		navigateAndClose("/modulo-discente");
	}, [navigateAndClose]);

	const handleClickLogin = useCallback(() => {
		navigate("/login");
	}, [navigate]);

	return {
		mobileOpen,
		setMobileOpen,
		isMobile,
		drawerWidth,
		handleDrawerToggle,
		handleDesktopDrawerToggle,
		handleClickHome,
		handleClickCursos,
		handleClickOrientadores,
		handleClickDicentes,
		handleClickOrientacoes,
		handleClickTemasTcc,
		handleClickModuloOrientador,
		handleClickModuloDiscente,
		handleClickLogin,
	};
}
