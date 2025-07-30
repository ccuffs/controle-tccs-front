import { Container, Box, Toolbar } from "@mui/material";
import { Route, Routes } from "react-router";
import React from "react";

import Navbar from "./Navbar";
import Login from "./Login";
import ProtectedRoute from "../contexts/ProtectedRoute";

import Cursos from "./Cursos";
import Orientadores from "./Orientadores";
import Dicentes from "./Dicentes";
import Orientacao from "./Orientacao";
import TemasTcc from "./TemasTcc";
import CustomThemeProvider from "./CustomThemeProvider";
import ThemeSwitch from "./ThemeSwitch";
import { AuthProvider } from "../contexts/AuthContext";

// Contexto para gerenciar o estado do drawer
export const DrawerContext = React.createContext();

function App() {
    const [desktopOpen, setDesktopOpen] = React.useState(false);

    return (
        <AuthProvider>
            <CustomThemeProvider>
                <DrawerContext.Provider value={{ desktopOpen, setDesktopOpen }}>
                    <Box sx={{ display: "flex" }}>
                        <Navbar />
                        <Box
                            component="main"
                            sx={{
                                flexGrow: 1,
                                p: 3,
                                width: {
                                    md: desktopOpen
                                        ? `calc(100% - 240px)`
                                        : "100%",
                                },
                                transition: (theme) =>
                                    theme.transitions.create(
                                        ["width", "margin"],
                                        {
                                            easing: theme.transitions.easing
                                                .sharp,
                                            duration:
                                                theme.transitions.duration
                                                    .leavingScreen,
                                        }
                                    ),
                            }}
                        >
                            <Toolbar /> {/* Spacing for AppBar */}
                            <ThemeSwitch />
                            <Container maxWidth="xl" sx={{ mt: 2 }}>
                                <Routes>
                                    <Route path="/login" element={<Login />} />
                                    <Route
                                        path="/"
                                        element={
                                            <ProtectedRoute>
                                                <Cursos />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="cursos"
                                        element={
                                            <ProtectedRoute>
                                                <Cursos />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="orientadores"
                                        element={
                                            <ProtectedRoute>
                                                <Orientadores />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="dicentes"
                                        element={
                                            <ProtectedRoute>
                                                <Dicentes />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="orientacoes"
                                        element={
                                            <ProtectedRoute>
                                                <Orientacao />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="temas-tcc"
                                        element={
                                            <ProtectedRoute>
                                                <TemasTcc />
                                            </ProtectedRoute>
                                        }
                                    />
                                </Routes>
                            </Container>
                        </Box>
                    </Box>
                </DrawerContext.Provider>
            </CustomThemeProvider>
        </AuthProvider>
    );
}

export default App;
