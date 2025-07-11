import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import Workflows from "./pages/Workflows";
import Filters from "./pages/Filters";
import Logs from "./pages/Logs";
import Contacts from "./pages/Contacts";
import Profile from "./pages/Profile";
import ApiTokens from "./pages/ApiTokens";
import NotFound from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Webhooks from "./pages/Webhooks";
import Settings from './pages/Settings';
import BulkMessaging from "./pages/BulkMessaging";
import SystemStatus from './pages/SystemStatus';
import Alerts from './pages/Alerts';
import Channels from "./pages/Channels";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, only show login/register pages
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, show the full app with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
            <div className="ml-4 font-semibold">Bot Admin</div>
          </header>
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/filters" element={<Filters />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/webhooks" element={<Webhooks />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/api-tokens" element={<ApiTokens />} />
              <Route path="/messaging" element={<BulkMessaging />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/system-status" element={<SystemStatus />} />
              <Route path="/channels" element={<Channels />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
