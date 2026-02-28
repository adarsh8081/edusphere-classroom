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
import ParentInvitationPage from "@/pages/ParentInvitationPage";
import AdminDashboard from "@/pages/AdminDashboard";
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
      <Route path="/login" component={AuthPage} />
      <Route path="/">
        {() => (
          <ProtectedRoute
            component={() => {
              const { user } = useAuth();
              if (user?.role === "super_admin") {
                return <Redirect to="/admin" />;
              }
              if (user?.role === "parent") {
                return <ParentDashboard />;
              }
              return <Dashboard />;
            }}
          />
        )}
      </Route>
      <Route path="/ecosystem">
        {() => <ProtectedRoute component={EcosystemHub} />}
      </Route>
      <Route path="/guilds">
        {() => <ProtectedRoute component={Guilds} />}
      </Route>
      <Route path="/forums">
        {() => <ProtectedRoute component={Forums} />}
      </Route>
      <Route path="/career">
        {() => <ProtectedRoute component={CareerLaunchpad} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} />}
      </Route>
      <Route path="/class/:classId">
        {() => <ProtectedRoute component={ClassView} />}
      </Route>
      <Route path="/messages">
        {() => <ProtectedRoute component={Messaging} />}
      </Route>
      <Route path="/settings/notifications">
        {() => <ProtectedRoute component={NotificationSettings} />}
      </Route>
      <Route path="/parent/register" component={ParentInvitationPage} />
      <Route component={NotFound} />
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
