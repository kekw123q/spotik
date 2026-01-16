import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";

// Импортируем только нашу страницу
import ProfilePage from "./pages/profile_page";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <TooltipProvider>
                {/* Уведомления оставляем, они полезны */}
                <Toaster />
                <Sonner />
                
                <BrowserRouter>
                    <Routes>
                        {/* Теперь главная страница (/) — это Профиль */}
                        <Route path="/" element={<ProfilePage />} />
                        
                        {/* Старый путь тоже оставим, на всякий случай */}
                        <Route path="/profile" element={<ProfilePage />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;