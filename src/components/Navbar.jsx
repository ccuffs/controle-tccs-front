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

const drawerWidth = 240;

function Navbar() {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { desktopOpen, setDesktopOpen } = React.useContext(DrawerContext);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    function handleDrawerToggle() {
        setMobileOpen(!mobileOpen);
    }

    function handleDesktopDrawerToggle() {
        setDesktopOpen(!desktopOpen);
    }

    function handleClickHome() {
        navigate("/");
        if (isMobile) setMobileOpen(false);
    }

    function handleClickCursos() {
        navigate("/cursos");
        if (isMobile) setMobileOpen(false);
    }

    function handleClickOrientadores() {
        navigate("/orientadores");
        if (isMobile) setMobileOpen(false);
    }

    function handleClickOfertas() {
        navigate("/ofertas");
        if (isMobile) setMobileOpen(false);
    }

    const drawerContent = (
        <Box sx={{ overflow: 'auto' }}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Menu
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleClickCursos}>
                        <ListItemText primary="Cursos" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleClickOrientadores}>
                        <ListItemText primary="Orientadores" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleClickOfertas}>
                        <ListItemText primary="Ofertas" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
                    ml: { md: desktopOpen ? `${drawerWidth}px` : 0 },
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={isMobile ? handleDrawerToggle : handleDesktopDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, cursor: 'pointer' }}
                        onClick={handleClickHome}
                    >
                        Sistema de Gestão de TCCs
                    </Typography>
                    <Button color="inherit">Login</Button>
                </Toolbar>
            </AppBar>

            {/* Mobile drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop drawer */}
            <Drawer
                variant="persistent"
                open={desktopOpen}
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: desktopOpen ? drawerWidth : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}

export default Navbar;
