
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./components/LandingPage";

const queryClient = new QueryClient();

const AppContent = () => {
  // TODO: Integrate Firebase Auth UI here if needed
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="visit-tracker-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthLayout>
          <AppContent />
        </AuthLayout>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
