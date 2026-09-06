import { useAuth } from "@/_core/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Analytics from "@/pages/Analytics";
import Calendar from "@/pages/Calendar";
import DashboardLayout from "@/components/DashboardLayout";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Workspace() {
  const { loading, user } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#f7f5ef]" />;
  if (!user) return <Landing />;
  return <DashboardLayout><Switch><Route path="/" component={Home} /><Route path="/calendar" component={Calendar} /><Route path="/analytics" component={Analytics} /><Route component={NotFound} /></Switch></DashboardLayout>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-center" /><Workspace /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
