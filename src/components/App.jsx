// import Grid from '@mui/material/Grid'; // Grid version 1

import { Container, Stack, Box, Toolbar } from "@mui/material";
import { Route, Routes } from "react-router";
import React from "react";

import Navbar from "./Navbar";

import Cursos from "./Cursos";
import Orientadores from "./Orientadores";
import CustomThemeProvider from "./CustomThemeProvider";
import ThemeSwitch from "./ThemeSwitch";

// Contexto para gerenciar o estado do drawer
export const DrawerContext = React.createContext();

function App() {
    const [desktopOpen, setDesktopOpen] = React.useState(false);

    return (
        <CustomThemeProvider>
            <DrawerContext.Provider value={{ desktopOpen, setDesktopOpen }}>
                <Box sx={{ display: 'flex' }}>
                    <Navbar />
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            p: 3,
                            width: { md: desktopOpen ? `calc(100% - 240px)` : '100%' },
                            transition: (theme) => theme.transitions.create(['width', 'margin'], {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.leavingScreen,
                            }),
                        }}
                    >
                        <Toolbar /> {/* Spacing for AppBar */}
                        <ThemeSwitch />
                        <Container maxWidth="xl" sx={{ mt: 2 }}>
                            <Routes>
                                <Route path="cursos" element={<Cursos />} />
                                <Route
                                    path="orientadores"
                                    element={<Orientadores />}
                                />

                            </Routes>
                        </Container>
                    </Box>
                </Box>
            </DrawerContext.Provider>
        </CustomThemeProvider>
    );
}

export default App;
