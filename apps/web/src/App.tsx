import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import ClassView from "@/pages/ClassView";
import ParentDashboard from "@/pages/ParentDashboard";
import Messaging from "@/pages/Messaging";
import NotificationSettings from "@/pages/NotificationSettings";
import ParentRegistration from "@/pages/ParentRegistration";
import AdminDashboard from "@/pages/AdminDashboard";
import VerificationPage from "@/pages/VerificationPage";
import ProfilePage from "@/pages/ProfilePage";
import PortfolioPage from "@/pages/PortfolioPage";
import MarketplacePage from "@/pages/Marketplace.tsx";
import { useAuth } from "@/hooks/use-auth";

import { Suspense, lazy } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// 3D Imports lazy loaded to prevent headless WebGL crashes
const Scene3D = lazy(() => import("@/components/Scene3D"));

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

import EcosystemHub from "@/pages/EcosystemHub";
import Guilds from "@/pages/Guilds";
import Forums from "@/pages/Forums";
import CareerLaunchpad from "@/pages/CareerLaunchpad";

function Router() {
  return (
    <Switch>
      <Route path="/login">
        {() => (
          <ErrorBoundary fallbackMessage="Authentication system failed to load. Please refresh.">
            <AuthPage />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/">
        {() => (
          <ErrorBoundary fallbackMessage="Dashboard failed to load. Please refresh.">
            <ProtectedRoute
              component={() => {
                const { user } = useAuth();
                if (user?.role === "super_admin") return <Redirect to="/admin" />;
                if (user?.role === "teacher") return <Redirect to="/Teacher" />;
                if (user?.role === "parent") return <ParentDashboard />;
                return <Dashboard />;
              }}
            />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/Teacher">
        {() => (
          <ErrorBoundary fallbackMessage="Teacher dashboard failed to load.">
            <ProtectedRoute
              component={() => {
                const { user } = useAuth();
                if (user?.role !== "teacher") return <Redirect to="/" />;
                return <Dashboard />;
              }}
            />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/ecosystem">
        {() => (
          <ErrorBoundary fallbackMessage="Ecosystem Hub failed to load.">
            <ProtectedRoute component={EcosystemHub} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/guilds">
        {() => (
          <ErrorBoundary fallbackMessage="Guilds failed to load.">
            <ProtectedRoute component={Guilds} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/forums">
        {() => (
          <ErrorBoundary fallbackMessage="Forums failed to load.">
            <ProtectedRoute component={Forums} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/career">
        {() => (
          <ErrorBoundary fallbackMessage="Career Launchpad failed to load.">
            <ProtectedRoute component={CareerLaunchpad} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <ErrorBoundary fallbackMessage="Admin panel encountered an error.">
            <ProtectedRoute component={AdminDashboard} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/class/:classId">
        {() => (
          <ErrorBoundary fallbackMessage="Class view failed to load.">
            <ProtectedRoute component={ClassView} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/messages">
        {() => (
          <ErrorBoundary fallbackMessage="Messaging system encountered an error.">
            <ProtectedRoute component={Messaging} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/settings/notifications">
        {() => (
          <ErrorBoundary fallbackMessage="Notification settings failed to load.">
            <ProtectedRoute component={NotificationSettings} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/parent/register">
        {() => (
          <ErrorBoundary fallbackMessage="Registration page failed to load.">
            <ParentRegistration />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <ErrorBoundary fallbackMessage="Profile page encountered an error.">
            <ProtectedRoute component={ProfilePage} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/portfolio/:slug">
        {() => (
          <ErrorBoundary fallbackMessage="Portfolio failed to load.">
            <PortfolioPage />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/parent/dashboard">
        {() => (
          <ErrorBoundary fallbackMessage="Parent dashboard encountered an error.">
            <ParentDashboard />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/marketplace">
        {() => (
          <ErrorBoundary fallbackMessage="Marketplace failed to load.">
            <ProtectedRoute component={MarketplacePage} />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/verify/:code">
        {() => (
          <ErrorBoundary fallbackMessage="Verification page failed to load.">
            <VerificationPage />
          </ErrorBoundary>
        )}
      </Route>
      <Route>
        {() => (
          <ErrorBoundary fallbackMessage="Page failed to load.">
            <NotFound />
          </ErrorBoundary>
        )}
      </Route>
    </Switch>
  );
}

// Hardcoded test override because headless drivers are unreliable
const isTestEnv = typeof navigator !== 'undefined' && (navigator.webdriver === true || window.location.search.includes('disable3d'));

import { ThemeProvider } from "@/components/theme-provider";

function App() {
  console.log("EduSphere: App init. isTestEnv:", isTestEnv);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          {/* Fixed 3D Background */}
          {!isTestEnv && (
            <ErrorBoundary fallback={<div className="fixed inset-0 z-[-1] bg-background" />}>
              <Suspense fallback={<div className="fixed inset-0 z-[-1] bg-background" />}>
                <Scene3D />
              </Suspense>
            </ErrorBoundary>
          )}

          {/* Main Content Overlay */}
          <div className="relative min-h-screen">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
