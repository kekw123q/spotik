import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AudioPlayerProvider } from "./presentation/context/AudioPlayerContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Player } from "./presentation/components/Player/Player";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Импортируем нашу новую страницу
import ProfilePage from "./pages/profilepage";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <TooltipProvider>
                <AudioPlayerProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Index />} />
                            
                            {/* --- ДОБАВИЛИ МАРШРУТ ПРОФИЛЯ --- */}
                            <Route path="/profile" element={<ProfilePage />} />

                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                        <Player />
                    </BrowserRouter>
                </AudioPlayerProvider>
            </TooltipProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;